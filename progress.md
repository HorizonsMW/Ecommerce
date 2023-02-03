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

create new
"
echo "# Ecommerce" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/HorizonsMW/Ecommerce.git
git push -u origin main
"

…or push an existing repository from the command line
git remote add origin https://github.com/HorizonsMW/Ecommerce.git
git branch -M main
git push -u origin main