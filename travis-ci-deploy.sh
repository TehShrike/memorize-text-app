cd public
git init
git config user.email "me@JoshDuff.com"
git config user.name "TravisCI script"
git remote add ghp https://TehShrike:$GITHUB_TOKEN@github.com/TehShrike/memorize-text-app.git
git add *
git commit -m "auto-deploy"
git push ghp master:gh-pages -f
