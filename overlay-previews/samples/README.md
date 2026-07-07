# Sample faces for overlay previews (optional)

Drop reference photos here to composite a guide over a real face in the preview
(`npm run overlays:preview`, then open `../index.html` or an individual `../<id>.svg`).

Name each file by **category** (the overlay id minus any `-l` / `-r` suffix). The first
matching extension found (`.jpg`, `.jpeg`, `.png`, `.webp`) is used:

| File | Used by overlays |
|---|---|
| `front.jpg`    | front |
| `oblique.jpg`  | oblique-l, oblique-r |
| `profile.jpg`  | profile-l, profile-r |
| `base.jpg`     | base |
| `cheek.jpg`    | cheek-l |
| `hairline.jpg` | hairline |
| `top.jpg`      | top |
| `crown.jpg`    | crown |
| `donor.jpg`    | donor |

No file → the guide is drawn on a plain dark background with a rule-of-thirds grid.
The photo is fit with `xMidYMid slice` (cover) inside the design canvas.
