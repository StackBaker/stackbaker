# StackBaker

StackBaker is the time management tool for college students. Stay on top of your work while making time for the things you care about.

# Publishing StackBaker

With GitHub Actions, most of the process of publishing a new version of the app is automated. However, there are some steps that should be taken to do this properly.

First of all, make sure that the changes you've made are worth publishing a new release. Compiling on GitHub Actions takes 10-20 minutes, and we only have a limited number of GitHub Actions minutes each month. 

Once you've made sure that it's time for a new release, change the version numbers in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`. Then, create a pull request to the main branch, and get it approved to merge to main.

Next, go to the app-releases repo and edit the `build_and_release.yml` workflow so that it creates a release with descriptive release notes, reflecting the changes made in the new version.

Finally, rebase the release branch on main from your local machine:

```sh
git checkout release
git rebase main
git push origin release
git checkout main
```

This will dispatch a workflow to the app-releases repo to build and publish a new release of the Desktop App there. Since the website tries to download the latest release, we don't need to make any changes to the website.

