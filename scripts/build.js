#!/usr/bin/env node
import { build } from "esbuild";
import minimist from "minimist";
import { fileURLToPath } from "node:url";
import { dirname, resolve, readdirSync } from "node:path";
import { rmSync, mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = minimist(process.argv.slice(2));

// 获取所有包名
const packages = readdirSync(resolve(__dirname, "../packages"));

// 解析参数
const targets = args._.length ? args._ : packages;
const formats = args.f ? args.f.split(",") : ["esm-bundler", "cjs"];
const sourcemap = args.s || false;
const prod = args.p || false;

// 构建单个包
async function buildPackage(target, format) {
  const pkgRoot = resolve(__dirname, "../packages", target);
  const pkg = await import(resolve(pkgRoot, "package.json"), {
    with: { type: "json" },
  });

  // 创建dist目录
  const distDir = resolve(pkgRoot, "dist");
  if (!args.f) {
    rmSync(distDir, { recursive: true, force: true });
  }
  mkdirSync(distDir, { recursive: true });

  // 构建配置
  const config = {
    entryPoints: [resolve(pkgRoot, "src/index.ts")],
    outfile: resolve(distDir, `${target}.${format}.js`),
    bundle: true,
    sourcemap,
    format: format === "cjs" ? "cjs" : "esm",
    platform: format === "cjs" ? "node" : "browser",
    external: [
      ...Object.keys(pkg.default.dependencies || {}),
      ...Object.keys(pkg.default.peerDependencies || {}),
    ],
    plugins: [
      {
        name: "alias",
        setup(build) {
          build.onResolve(
            {
              filter: /^@vue\/(.*)$/,
            },
            (args) => {
              const [, pkgName] = args.path.split("/");
              return {
                path: resolve(
                  __dirname,
                  "../packages",
                  pkgName,
                  "src/index.ts"
                ),
              };
            }
          );
        },
      },
    ],
  };

  // 生产模式下添加压缩
  if (prod) {
    config.minify = true;
    config.outfile = config.outfile.replace(".js", ".prod.js");
  }

  console.log(`🚀 构建 ${target} (${format})...`);
  try {
    await build(config);
    console.log(`✅ ${target} (${format}) 构建完成！`);
  } catch (error) {
    console.error(`❌ ${target} (${format}) 构建失败:`, error);
    throw error;
  }
}

// 构建所有目标
async function runBuild() {
  console.log(`📦 开始构建 ${targets.length} 个包...`);

  for (const target of targets) {
    if (!packages.includes(target)) {
      console.error(`❌ 包 ${target} 不存在！`);
      process.exit(1);
    }

    for (const format of formats) {
      await buildPackage(target, format);
    }
  }

  console.log(`🎉 所有构建完成！`);
}

runBuild().catch(() => process.exit(1));
