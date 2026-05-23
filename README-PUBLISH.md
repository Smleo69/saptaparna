# Publish This Site On GitHub Pages

This folder is the deploy-ready version of the site.

Upload the CONTENTS of this `github-pages` folder to a GitHub repository:

- `index.html`
- `.nojekyll`
- `assets/`

Do not upload the parent folder itself as the website root unless you configure GitHub Pages to use that folder.

## Add Real Photos

1. Put photos in `assets/photos/`.
2. Open `index.html`.
3. Find `const defaultGallery = [`.
4. Replace image paths and captions:

```js
const defaultGallery = [
  {
    src: "assets/photos/photo-1.jpg",
    cap: "Write the memory note for this photo here."
  }
];
```

## Add Poems

Find `const defaultPoems = [];` and replace it with:

```js
const defaultPoems = [
  {
    id: 1,
    title: "Poem title",
    date: "2026-05-24",
    content: `Your poem text here.
Line two here.`
  }
];
```

## Add The Letter

Find `const defaultLetter = "";` and replace it with:

```js
const defaultLetter = `My dearest,

Write your letter here.`;
```

## Add Surprise Messages

Find `const defaultSurprises = [` and edit the messages.

## Add Music

Put songs in `assets/music/`, then find `const defaultPlaylist = [];` and replace it with:

```js
const defaultPlaylist = [
  {
    src: "assets/music/song-1.mp3",
    name: "Song name"
  }
];
```

## GitHub Pages Steps

1. Create a new GitHub repository.
2. Upload the contents of this folder.
3. Go to repository `Settings`.
4. Go to `Pages`.
5. Source: `Deploy from a branch`.
6. Branch: `main`.
7. Folder: `/root`.
8. Save.

GitHub will give you a link like:

`https://your-username.github.io/repository-name/`

## About Code Privacy

Visitors cannot change your live site unless they have access to your GitHub account or repository.

They can still view/copy frontend HTML/CSS/JS because browsers need that code to show the page. That is normal for static websites.
