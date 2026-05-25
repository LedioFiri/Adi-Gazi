# Mobileri Adi Gazi

Static portfolio website for **Mobileri Adi Gazi**, a furniture and woodwork business based in Nikel, Fushe Kruje. The site presents custom furniture categories, product galleries, business information, and contact options through WhatsApp, phone, Instagram, and Facebook.

## Overview

The website is built with plain HTML, CSS, and JavaScript. It does not require a build step or backend server, so it can be opened directly in a browser or hosted on any static hosting service.

Main features:

- Responsive homepage with hero section and product category cards
- Category pages for kitchens, wardrobes/rafte, minibars, beds, doors, stairs, and sofa corners
- Main product listing page in `produktet.html`
- Individual product detail pages with image galleries and lightbox behavior
- About page with business details
- Contact page with phone, location, social media, and WhatsApp contact
- Mobile navigation menu
- Scroll reveal animations and floating WhatsApp action button
- Cloudinary-hosted product images

## Main Files

```text
index.html          Homepage
categories.html     Category overview
produktet.html      Main product gallery/listing
about.html          About the business
contact.html        Contact information
style.css           Main stylesheet
script.js           Mobile menu and reveal behavior
README.md           Project documentation
```

## Category Folders

```text
dollape/            Rafte and wardrobes
Dyer/               Wooden doors
kende/              Sofa corners / living room products
krevate/            Beds
kuzhina/            Kitchens
minibare/           Minibars
shkalle/            Wooden stairs
```

Each folder contains an `index.html` category page and product detail pages for that category.

## Product Pages

Current product page patterns:

```text
dollape/dollap1.html
dollape/rafte*.html
Dyer/dera*.html
kende/kendi*.html
krevate/krevati*.html
kuzhina/kuzhina*.html
minibare/minibari*.html
shkalle/shkalla*.html
```

When linking from root files such as `index.html`, `categories.html`, or `produktet.html`, include the folder name:

```html
<a href="dollape/rafte1.html">...</a>
<a href="minibare/minibari1.html">...</a>
```

When linking from inside a category folder, use local file names or `../` for other folders:

```html
<a href="rafte1.html">...</a>
<a href="../minibare/index.html">Minibare</a>
```

## How to Run

Because this is a static website, no installation is required.

1. Open the project folder.
2. Double-click `index.html`.
3. The website will open in your browser.

You can also use a simple local server if preferred.

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Font Awesome icons
- Cloudinary image hosting
- YouTube embeds on selected product pages

## Contact Details Used in the Site

```text
Business: Mobileri Adi Gazi
Phone: 068 205 4255
WhatsApp: https://wa.me/355682054255
Location: Nikel, Fushe Kruje
Instagram: mobileri Adi Gazi
Facebook: mobileri Adi Gazi
```

## Customization

To update the website:

- Edit text content inside the `.html` files.
- Change colors, spacing, cards, buttons, and layout in `style.css`.
- Update mobile menu or animation behavior in `script.js`.
- Replace product images by changing the Cloudinary `src` values in the HTML files.
- Update WhatsApp links by replacing `https://wa.me/355682054255`.
- Add new products by copying an existing product card and changing the image, title, description, and link.
- For a new detail page, copy an existing product detail page from the same category and update the title, gallery images, and links.

## Deployment

This project can be deployed on any static hosting platform, including:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Traditional web hosting with FTP/cPanel

For hosting, upload all HTML files, `style.css`, `script.js`, and all category folders together so internal links continue to work.

## Notes

- The website language is Albanian.
- Most product photos are loaded from Cloudinary links.
- Font Awesome is loaded from a CDN, so an internet connection is needed for icons to appear.
- Keep folder names and file names consistent because the pages use relative links.
- Product pages use repeated HTML templates, so update both the category index and `produktet.html` when adding products that should appear in both places.

## Original Developer

```text
Ledio Firi
GitHub: Ledio Firi
Email: firiledio2007@gmail.com
```
