// ==UserScript==
// @name         Jira PR Badges
// @version      1.1
// @description  Adds badges to tickets in jira scrum board to indicate pull request status
// @match        https://{your-jira-server}/secure/RapidBoard.jspa?rapidView=3198*
// ==/UserScript==

// NOTE: to use this, find and replace all occurrences of {your-jira-server} with your actual jira server.
// NOTE: you may also need to change the @match URL for whatever scrum board you want to run this on.

const BADGE_TYPES = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    MERGED: 'MERGED',
};

const BADGE_CLASSES = {
    OPEN: 'aui-lozenge-current',
    IN_PROGRESS: 'aui-lozenge-complete',
    MERGED: 'aui-lozenge-success',
};

const BADGE_TEXT = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN PROGRESS',
    MERGED: 'MERGED',
};

const badgesCache = new Map(); // : <string, Set>
let badgesCacheLastUpdated = 0;

const cache = (ticketKey, badges) => {
    const now = new Date();
    badgesCache.set(ticketKey, badges);
    badgesCacheLastUpdated = now;
};

const clearCacheIfExpired = () => {
    const expiry = 1000 * 60 * 30; // 30 mins
    const elapsed = new Date() - badgesCacheLastUpdated;
    if (elapsed > expiry) {
        badgesCache.clear();
    }
};

const fetchBadgesAndStoreInCache = (ticketKey) => {
    cache(ticketKey, new Set()); // store empty entry in cache immediately so we don't get multiple async fetches for the same ticket

    return fetch(`https://{your-jira-server}/rest/api/latest/issue/${ticketKey}`).then(response => {
        return response.json();

    }).then(responseJson => {
        const ticketId = responseJson.id; // eg 123456
        return fetch(`https://{your-jira-server}/rest/dev-status/1.0/issue/detail?issueId=${ticketId}&applicationType=stash&dataType=pullrequest`);

    }).then(response => {
        return response.json();

    }).then(responseJson => {
        const prList = responseJson?.detail?.[0]?.pullRequests;
        const badges = new Set();
        prList.forEach(pr => {
            if (pr.status === 'OPEN') {
                if (!pr.reviewers?.length) {
                    badges.add(BADGE_TYPES.OPEN);
                } else {
                    badges.add(BADGE_TYPES.IN_PROGRESS);
                }
            } else if (pr.status === 'MERGED') {
                badges.add(BADGE_TYPES.MERGED);
            }
        });
        cache(ticketKey, badges);
        return badges;

    }).catch((err) => console.error(err));
};

const fetchBadgesOrGetFromCache = (ticketKey) => {
    const cached = badgesCache.get(ticketKey);
    if (cached) {
        return Promise.resolve(cached);
    }
    return fetchBadgesAndStoreInCache(ticketKey);
};

const addBadge = (ticket, keySelector) => {
    const ticketKey = ticket.querySelector(keySelector)?.innerText; // eg MEM-1234
    if (!ticketKey) {
        return;
    }
    fetchBadgesOrGetFromCache(ticketKey).then(badges => {
        badges.forEach(badge => {
            ticket.innerHTML += ` <span class="fancy-badge aui-lozenge ${BADGE_CLASSES[badge]}">${BADGE_TEXT[badge]}</span>`
        });
    }).catch((err) => console.error(err));
};

const addBadges = () => {
    clearCacheIfExpired();
    const tickets = document.querySelectorAll('.ghx-issue-fields');
    const parentTickets = document.querySelectorAll('.ghx-heading');
    tickets.forEach(ticket => addBadge(ticket, '.ghx-key'));
    parentTickets.forEach(parentTicket => addBadge(parentTicket, '.ghx-parent-key'));
};

const main = () => {
    setTimeout(function() {
        const noBadges = !document.querySelector('.fancy-badge');
        if (noBadges) {
            addBadges();
        }
        main();
    }, 2000);
};

main();
