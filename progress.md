01:13:15

$ git init
$ git add --all
$ git commit -m "Message"

create the remote repo with no readme and license
add the remote repo to git

$ git remote add ecommerce https://github.com/HorizonsMW/ecommerce

check current branch

$ git status

set default branch as main
$ git config --global init.defaultBranch main

create a branch if need be
$ git checkout -b main

change to main
$ git checkout main