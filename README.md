# download_as_cbz

A firefox extension to download a group of images from a webpage as a cbz file.

## Getting Started

Update the attribute `matches` in `manifest.json` to list the websites where 
the extension will work. See [Match patterns](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns) for more info.

## Usage

Click on any image in a website and the extension will group all images that 
should belong together based on the parents elements and a threshold. Then it 
will output a cbz file.
