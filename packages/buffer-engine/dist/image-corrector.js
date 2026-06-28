"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCompliantPostImage = ensureCompliantPostImage;
exports.ensureCompliantGoogleBusinessImage = ensureCompliantGoogleBusinessImage;
exports.correctedImageExists = correctedImageExists;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const image_url_1 = require("./image-url");
/**
 * Lazily load `sharp` only when an image actually needs transcoding.
 *
 * `sharp` is a native module. Importing it at module-eval time makes Next.js
 * attempt to load its platform binary while *collecting page data* during
 * `next build`, which fails on CI/Vercel (linux-x64) and aborts the build.
 * Deferring the import keeps the build static-analysis safe; the binary is only
 * required at runtime inside the scheduler cron, which never runs at build time.
 */
async function loadSharp() {
    const mod = await Promise.resolve().then(() => __importStar(require('sharp')));
    return mod.default ?? mod;
}
async function fetchImageBytes(url, fetchFn) {
    const res = await fetchFn(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(`Failed to fetch image: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}
async function transcodeToCompliant(input, preferPng) {
    const sharp = await loadSharp();
    let quality = 82;
    let width = 1600;
    for (let attempt = 0; attempt < 8; attempt++) {
        const pipeline = sharp(input).rotate().resize({ width, withoutEnlargement: true });
        const buffer = preferPng
            ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
            : await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        if (buffer.length <= image_url_1.BUFFER_MAX_IMAGE_BYTES && (0, image_url_1.isJpegOrPngMagicBytes)(new Uint8Array(buffer))) {
            return {
                buffer,
                contentType: preferPng ? 'image/png' : 'image/jpeg',
            };
        }
        quality = Math.max(55, quality - 8);
        width = Math.max(800, Math.floor(width * 0.85));
    }
    const buffer = await sharp(input)
        .rotate()
        .resize({ width: 720, withoutEnlargement: true })
        .jpeg({ quality: 70, mozjpeg: true })
        .toBuffer();
    return { buffer, contentType: 'image/jpeg' };
}
/**
 * Ensure a post image is Buffer-compliant. Writes to public/images/buffer/{siteId}/{slug}.jpg
 * and returns the public URL.
 */
async function ensureCompliantPostImage(options) {
    const fetchFn = options.fetchFn ?? fetch;
    const publicDir = options.publicDir ?? (0, node_path_1.join)(process.cwd(), 'public');
    const relPath = `images/buffer/${options.siteId}/${options.slug}.jpg`;
    const absPath = (0, node_path_1.join)(publicDir, relPath);
    const publicUrl = `${options.siteUrl.replace(/\/$/, '')}/${relPath}`;
    if (options.sourceImageUrl?.trim()) {
        const probe = await (0, image_url_1.probeBufferImageUrl)(options.sourceImageUrl, fetchFn, options.siteUrl);
        if (probe.ok) {
            return {
                publicUrl: options.sourceImageUrl.trim(),
                publicPath: relPath,
                contentType: probe.contentType?.includes('png') ? 'image/png' : 'image/jpeg',
                bytes: probe.contentLength ?? 0,
            };
        }
    }
    if (!options.sourceImageUrl?.trim())
        return null;
    try {
        const raw = await fetchImageBytes(options.sourceImageUrl, fetchFn);
        const { buffer, contentType } = await transcodeToCompliant(raw, options.preferPng ?? false);
        // transcodeToCompliant guarantees JPEG/PNG magic bytes and <= 5MB.
        if (buffer.length > image_url_1.BUFFER_MAX_IMAGE_BYTES || !(0, image_url_1.isJpegOrPngMagicBytes)(new Uint8Array(buffer.subarray(0, 16)))) {
            return null;
        }
        (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(absPath), { recursive: true });
        (0, node_fs_1.writeFileSync)(absPath, buffer);
        return {
            publicUrl,
            publicPath: relPath,
            contentType,
            bytes: buffer.length,
        };
    }
    catch {
        return null;
    }
}
async function ensureCompliantGoogleBusinessImage(imageUrl, siteUrl, fetchFn = fetch) {
    const probe = await (0, image_url_1.probeGoogleBusinessImageUrl)(imageUrl, fetchFn, siteUrl);
    if (probe.ok)
        return imageUrl;
    return undefined;
}
function correctedImageExists(publicDir, siteId, slug) {
    return (0, node_fs_1.existsSync)((0, node_path_1.join)(publicDir, 'images', 'buffer', siteId, `${slug}.jpg`));
}
