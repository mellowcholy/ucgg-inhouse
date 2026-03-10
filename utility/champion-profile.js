const fs = require('fs');
const path = require('path');

// --- Configuration ---
const TEMPLATE_FILE = './profiles/modern_white.js';
const IMAGE_FOLDER = './img/profiles/champions'; // folder containing your .png files
const OUTPUT_FOLDER = './profiles/champions'; // folder where generated .js files will be saved
// ---------------------

const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

if (!fs.existsSync(OUTPUT_FOLDER)) {
	fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
}

const files = fs.readdirSync(IMAGE_FOLDER);
let count = 0;

for (const file of files) {
	const ext = path.extname(file).toLowerCase();
	if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;

	const name = path.basename(file, ext);
	const output = template.replace(
		"background = await Canvas.loadImage('./img/profiles/modern_white.png');",
		`background = await Canvas.loadImage('./img/profiles/champions/${file}');`,
	);

	const outPath = path.join(OUTPUT_FOLDER, `${name}.js`);
	fs.writeFileSync(outPath, output, 'utf8');
	console.log(`✔ Created: ${outPath}`);
	count++;
}

console.log(`\nDone! ${count} file(s) generated in '${OUTPUT_FOLDER}'.`);