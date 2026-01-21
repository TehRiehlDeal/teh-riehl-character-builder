# App Icons

PWA icons for the PF2e Character Builder.

## Generated Icons

All icons have been generated from the source SVG files. The design features a D20 die (representing the d20 system used in Pathfinder 2e) with a purple gradient background matching the app's theme colors.

### Icon Files

**Standard Icons (with rounded corners):**
- icon-72x72.png - For Android (ldpi)
- icon-96x96.png - For Android (mdpi)
- icon-128x128.png - For Chrome Web Store
- icon-144x144.png - For Microsoft
- icon-152x152.png - For iPad
- icon-192x192.png - For Android (xxxhdpi) - PWA standard
- icon-384x384.png - For splash screens
- icon-512x512.png - For PWA standard, splash screens

**Maskable Icons (adaptive icons for Android):**
- icon-192x192-maskable.png - Maskable version with safe zone
- icon-512x512-maskable.png - Maskable version with safe zone

### Source Files

- `source-icon.svg` - Main icon source (512x512) with rounded corners
- `source-icon-maskable.svg` - Maskable icon source (no rounded corners, scaled content for safe zone)

## Regenerating Icons

If the design needs to be updated, modify the source SVG files and regenerate:

```bash
cd static/icons

# Generate standard icons
for size in 72 96 128 144 152 192 384 512; do
  magick source-icon.svg -resize ${size}x${size} icon-${size}x${size}.png
done

# Generate maskable icons
magick source-icon-maskable.svg -resize 192x192 icon-192x192-maskable.png
magick source-icon-maskable.svg -resize 512x512 icon-512x512-maskable.png
```

## Design Notes

- **Color Scheme:** Purple gradient (#5c16c5 to #7c3aed) matching app theme
- **Icon Content:** D20 die with "20" on the visible face
- **Maskable Safe Zone:** Content scaled to 70% for adaptive icons
- **Background:** Rounded corners for standard icons, full bleed for maskable

## Future Improvements

If a designer creates professional icon assets:
1. Replace the source SVG files
2. Regenerate all PNG sizes using the commands above
3. Ensure maskable versions maintain the 80% safe zone for content
4. Update `src/lib/assets/favicon.svg` to match

## References

- [PWA Icon Guidelines](https://web.dev/add-manifest/#icons)
- [Maskable Icon Spec](https://web.dev/maskable-icon/)
- [Icon Specifications by Platform](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/)
