# Yggdrasil · 品牌标识

[世界树透明 PNG](yggdrasil-mark.png) 用于项目 README 顶部。

- 尺寸：1254 × 1254。
- 格式：RGBA PNG，带真实透明通道。
- 设计：金色树冠、深青色结构、交织树干与根系。
- 生成日期：2026-10-30（Asia/Shanghai）。
- 生成方式：内置 `image_gen`，`transparent_background: true`。
- 保存原始生成文件，未重新抠图或转换透明通道。

## 最终生成提示词

```text
Use case: logo-brand. Asset type: a transparent PNG brand emblem for the top of the Yggdrasil GitHub README. Create one original, refined world-tree emblem with an airy branching crown balanced by beautifully interwoven roots; the sculptural central trunk subtly suggests a Y through its natural form. Restrained Nordic knotwork is confined to the trunk, with a small number of elegant, clearly defined leaf clusters and strong readable branch silhouettes. Art direction: premium editorial identity, quiet and architectural, crisp precise contours, restrained shallow metallic shading rather than photographic foliage. Palette: warm antique champagne gold with rich petroleum-teal structural accents, balanced so the mark reads clearly on both white and GitHub dark backgrounds. Center a single emblem on a square transparent canvas, with about 10 percent clear padding on all sides and no additional objects. The silhouette should remain clear at a displayed width of 220 pixels. Output a real RGBA PNG with genuinely transparent alpha everywhere outside the emblem and throughout the open negative spaces between branches and roots. No background, no opaque plate, no border, no enclosing circle, no scenery, no cast shadow, no diffuse glow, no checkerboard pattern, no typography, no watermark. The tree itself is the entire visual identity.
```

## 网站图标 · 世界树与 Ratatoskr

网站小图标以几何世界树和融入根部的松鼠轮廓组成，采用青绿浅浮雕标识与深墨蓝渐变底；柔和高光、连续曲线圆角和轻微接触阴影带来克制的 macOS 应用图标质感。

- [生成原稿](favicon-master.png)：1254 × 1254，RGBA PNG。
- [浏览器 PNG](../favicon.png)：32 × 32。
- [多尺寸 ICO](../favicon.ico)：包含 16 / 32 / 48 / 64 / 128 / 256 像素版本。
- 圆角方形以外保留真实透明通道。
- 生成日期：2026-10-30（Asia/Shanghai）。
- 生成方式：内置 `image_gen`，先生成初版，再参考原稿微调材质与光照；保留透明圆角。
- 图标尺寸由原稿等比导出，ICO 采用多幅 PNG 封装；程序未重绘标识。
- `index.html` 使用相对路径，适用于 GitHub Pages 项目子目录；更新图标时同步更新引用中的缓存版本。

### 初始生成提示词

```text
Use case: logo-brand. Create a single finished favicon/app-icon for Yggdrasil, a modern technology project, combining the Norse world tree and Ratatoskr the squirrel in ONE compact geometric mark. Design for legibility at 16 and 32 pixels, not a detailed illustration. The symbol is a bold branching Y-shaped world tree, with only three strong upper boughs and two simple root strokes. Integrate a distinctly squirrel-like pointed ear, short profile snout and ONE large sweeping curled tail into the right side of the trunk/root silhouette; use clever negative space so the tree and squirrel share the same geometry. The squirrel is integrated into the tree, not a separate mascot standing beside it. Strong simple silhouette, substantial uniform stroke thickness, a small number of clean connected shapes, generous negative spaces. Visual style: contemporary premium software identity, flat vector-like construction, precise soft geometric curves, minimal, confident, spacious. Palette follows the project's existing cyber-cyan and deep teal theme: luminous cool mint/cyan with a restrained teal transition on a solid very dark ink-navy rounded-square tile, roughly 20 percent corner radius. The outside corners beyond the tile are genuinely transparent alpha. Center the mark and let it occupy about 75 percent of the tile. No words, no letter labels, no text, no watermark. No gold, metallic material, ornate knots, decorative frame, realistic leaves, fur, tiny veins, sparkles, stars, lens flares, 3D extrusion or heavy shadow. One icon only, front-on, perfectly square composition, real RGBA transparent PNG outside the rounded-square tile.
```

### 果味微调 · 最终提示词

编辑参考：[初版原稿](https://github.com/yakasuka/yggdrasil/blob/e14c939ffbd2fc9010cf3626baf04e0f6ac3f2fc/assets/favicon-master.png)。保留树与松鼠的造型和构图，微调材质、光照与转折。

```text
Use case: style-transfer. Edit the supplied Yggdrasil favicon with a SMALL Apple/macOS-inspired refinement, not a redesign. Preserve the existing combined world-tree and Ratatoskr squirrel mark: the three-leaf branching tree, root arrangement, squirrel side profile, pointed ear and large curled tail, along with the same centered composition, scale and negative spaces. Keep the mint/cyan and deep navy color family. Make the icon feel a little more like a carefully crafted native macOS app icon: a smooth continuous-curve squircle tile, a restrained deep navy-to-petrol gradient illuminated softly from the upper left, and a very shallow raised satin/ceramic treatment on the cyan mark. Use delicate edge highlights and soft close contact shading to give just a hint of dimensionality. Slightly soften sharp micro-transitions while keeping the silhouette bold, clean and recognizable at 16 and 32 pixels. Lighting must be coherent, surfaces exceptionally clean, with generous breathing space and understated finish. Avoid exaggerated glossy glass, chrome, deep extrusion, photorealistic texture, sparkles, new decorative details, new objects, text, lettering, watermark, and any Apple logo. The original icon identity should remain immediately recognizable; only the material, lighting and subtle corner refinement should change. Preserve genuine transparency outside the rounded-square tile, with no opaque background plate or cast shadow outside it.
```
