git config user.email "me@JoshDuff.com"
git config user.name "TravisCI script"
git remote add ghp https://TehShrike:$GITHUB_TOKEN@github.com/TehShrike/memorize-text-app.git
git checkout -b gh-pages
git add public/build.* -f
git push ghp gh-pages -f
