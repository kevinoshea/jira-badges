#! /usr/bin/python
import os
import sys
import argparse
import subprocess

# This script facilitates executing commands over a number of git repositories and displaying aggregated results.

# Directory containing all repositories to execute commands. Do not put a '/' at the end.
ROOT_DIR = os.path.expanduser('~/dev')

# List of the repository names.
REPOS = [
    'repo1',
    'repo2',
    'repo3'
]

def parse_args():
    status_help = "Print status of all the things.\n"
    pull_help = "Pull all the things"

    parser = argparse.ArgumentParser(formatter_class=argparse.RawTextHelpFormatter)

    exclusive_group = parser.add_mutually_exclusive_group()
    exclusive_group.add_argument("--status", action="store_true", help=status_help)
    exclusive_group.add_argument("--pull", action="store_true", help=pull_help)

    parser.add_argument("positional_arguments", nargs='*', help=argparse.SUPPRESS)

    return parser.parse_args()

def printInColumns(row):
    pattern = "{: <60}" * len(row)
    print(pattern.format(*row))

def printLine(char):
    print char * 130

def execute(cmd, call):
    if (call):
        return subprocess.call(cmd, shell=True)
    return subprocess.check_output(cmd.split(' '))

# Execute the given command in the given repository.
# If printResult is false the output is returned. If true the output will be printed to the console instead and the response code will be returned.
def executeForRepo(repo, cmd, printResult=False):
    directory = ROOT_DIR + '/' + repo
    current_dir = os.getcwd()
    os.chdir(directory)
    ret = execute(cmd, printResult)
    os.chdir(current_dir)
    return ret

def printGitStatus(repo):
    executeForRepo(repo, 'git status --short', printResult=True)

def getCurrentBranch(repo):
    return executeForRepo(repo, 'git rev-parse --abbrev-ref HEAD').strip()

def getCommitsBehind(repo):
    currentBranch = getCurrentBranch(repo)
    executeForRepo(repo, 'git fetch --quiet') # Fetch before the count so that we have the remote info for the count.
    return executeForRepo(repo, 'git rev-list --left-right --count origin/' + currentBranch + '...' + currentBranch).split('\t')[0]

def printStatusRow(repo):
    printInColumns([repo, getCurrentBranch(repo), getCommitsBehind(repo)])
    printGitStatus(repo)

def printStatusTable():
    printLine('=')
    printInColumns(['Repo', 'Branch', '#Behind'])
    printLine('=')
    for repo in REPOS:
        printStatusRow(repo)
        printLine('-')

def pullAllTheThings():
    for repo in REPOS:
        printLine('=')
        print repo
        printLine('=')
        executeForRepo(repo, 'git pull', printResult=True)

def __main():
    args = parse_args()
    if args.status:
        printStatusTable()
        return
    if args.pull:
        pullAllTheThings()
        return
    print 'Type --help for usage'
    sys.exit(1)

if __name__ == "__main__":
	__main()
