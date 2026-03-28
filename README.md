# This README containes some rules for the git workflow

## this is the main branch please dont push anything in this branch u can check for available branches with these commands
- to list all available branches:
```bash
git branch #check available branches locally
git branch -r #check available remote branches
```
- to create a branch u need first to switch to dev branch then create a branch with the feature you are working on
```bash
git checkout dev #switch to branch
git pull origin dev #for branch updates
git checkout -b feature/UI_example #create and switch to branch
```
- once u finished ur feature and made sure your code is stable and ready to merge open a pull request for code review and merging into dev branch (we dont merge/push to main branch until the project is stable)

- read more about the project gitflow on `git_workflow.md`


## Please read any available documantation in this branch for project clarity (very useful):
- `trancsendence_project_planning.md` contains the project goal, the whole project structure, module planning and the stack we will be using and working on, aswell with work divided on team members with each one has its own role.
- `git_workflow.md` contains some basic rules for git and working with branches.
- `game_architecture.md` useful for the game architecture and what are we suppose to build.
- `database_schema.md` for the database and data tables structure for db design clarity.

## first thing to do now check dev branch for the current available work
```bash
git checkout dev
git pull origin dev
ls -al
```
