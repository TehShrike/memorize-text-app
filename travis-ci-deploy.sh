git config user.email "me@JoshDuff.com"
git config user.name "TravisCI script"

mkdir deploy
cd deploy
git init
git remote add ghp https://TehShrike:$GITHUB_TOKEN@github.com/TehShrike/memorize-text-app.git
git fetch ghp
git checkout ghp/gh-pages
git checkout -b gh-pages

git rm *

touch .nojekyll
git add .nojekyll
echo "memorizetext.com" > CNAME

mv ../public/* .
git add *
git commit -m "auto-deploy"
git push ghp gh-pages
