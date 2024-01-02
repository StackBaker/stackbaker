# StackBaker

StackBaker is the time management tool for college students. Stay on top of your work while making time for the things you care about.

# Publishing StackBaker

Releases of StackBaker are hosted on our [app-releases repo](https://github.com/StackBaker/app-releases). That repo was created so we could publicly publish the app while keeping the code private. However, now that StackBaker is open source, it exists for continuity and ease of finding the app releases. This may change in the future.

As for actually publishing a new version of StackBaker, most the process is automated with GitHub Actions. However, there are some steps that should be taken to do this properly.

First of all, make sure that the changes you've made are worth publishing a new release. Compiling on GitHub Actions takes 10-20 minutes, and we only have a limited number of GitHub Actions minutes each month. 

Once you've made sure that it's time for a new release, change the version numbers in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`. Then, create a pull request to the main branch, and get it approved to merge to main.

Next, go to the [app-releases repo](https://github.com/StackBaker/app-releases) and edit the `build_and_release.yml` workflow so that it creates a release with descriptive release notes, reflecting the changes made in the new version.

Finally, manually run the `build_and_release` workflow from the app-releases repo. That workflow will also update the links on the website.
