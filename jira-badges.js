// ==UserScript==
// @name         Jira PR Badges
// @version      1.0
// @description  Adds badges to tickets in jira scrum board to indicate pull request status
// @match        https://{your-jira-server}/secure/RapidBoard.jspa?rapidView=3198*
// ==/UserScript==

// NOTE: to use this, find and replace all occurrences of {your-jira-server} with your actual jira server.

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

const addBadge = (ticket, keySelector) => {
    const ticketKey = ticket.querySelector(keySelector).innerText; // eg XYZ-1234

    fetch(`https://{your-jira-server}/rest/api/latest/issue/${ticketKey}`).then(response => {
        return response.json();

    }).then(responseJson => {
        const ticketId = responseJson.id; // eg 123456
        return fetch(`https://{your-jira-server}/rest/dev-status/1.0/issue/detail?issueId=${ticketId}&applicationType=stash&dataType=pullrequest`);

    }).then(response => {
        return response.json();

    }).then(responseJson => {
        const badgesAdded = [];
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
        badges.forEach(badge => {
            ticket.innerHTML += ` <span class="aui-lozenge ${BADGE_CLASSES[badge]}">${BADGE_TEXT[badge]}</span>`
        });

    }).catch((err) => console.error(err));
};

const addBadges = () => {
    const tickets = document.querySelectorAll('.ghx-issue-fields');
    const parentTickets = document.querySelectorAll('.ghx-heading');
    tickets.forEach(ticket => addBadge(ticket, '.ghx-key'));
    parentTickets.forEach(parentTicket => addBadge(parentTicket, '.ghx-parent-key'));
};

const main = () => {
    setTimeout(function() {
        const ticketsNotLoadedYet = !document.querySelector('.ghx-issue-fields');
        if (ticketsNotLoadedYet) {
            main();
        } else {
            addBadges();
        }
    }, 2000);
};

main();
