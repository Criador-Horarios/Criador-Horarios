echo --------
echo Pulling from git
rm package-lock.json yarn.lock
git checkout .
git pull

echo 
echo --------
echo Install dependencies and build
yarn install --prod
yarn build

echo 
echo --------
echo Backup previous deploy
rm -rf build_backup
cp -r build_deploy/ ./build_backup

echo 
echo --------
echo Remove previous deploy and copy new one
rm -rf build_deploy
cp -r build/ ./build_deploy
