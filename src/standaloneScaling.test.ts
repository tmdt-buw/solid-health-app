import { readFileSync } from "fs";
import { resolve } from "path";

describe("standalone scaling", () => {
  const styles = readFileSync(resolve(__dirname, "index.css"), "utf8");
  const appSource = readFileSync(resolve(__dirname, "App.tsx"), "utf8");
  const standaloneEntry = readFileSync(resolve(__dirname, "index.tsx"), "utf8");
  const themeStyles = readFileSync(resolve(__dirname, "tmdt-theme.css"), "utf8");
  const embedEntry = readFileSync(
    resolve(__dirname, "embed/SolidHealthAppEmbed.tsx"),
    "utf8"
  );

  test("uses zoom only outside Safari and leaves Safari unscaled", () => {
    expect(styles).toMatch(
      /body\.solid-health-standalone\s*\{[^}]*zoom:\s*var\(--solid-health-standalone-scale\)/s
    );
    expect(styles).toMatch(
      /html\.browser-safari\s+body\.solid-health-standalone\s*\{[^}]*--solid-health-standalone-vh:\s*100vh[^}]*zoom:\s*1/s
    );
    expect(styles).toMatch(
      /html\.browser-safari\s+body\.solid-health-standalone\s*\{[^}]*--solid-health-standalone-vh:\s*100dvh/s
    );
    expect(styles).not.toMatch(
      /body\.solid-health-standalone\s*>\s*#root\s*\{[^}]*transform\s*:/s
    );
    expect(styles).not.toMatch(
      /transform:\s*scale\(var\(--solid-health-standalone-scale\)\)/
    );
  });

  test("runs Safari detection only from the standalone entry", () => {
    expect(standaloneEntry).toMatch(
      /import\s*\{\s*markSafariBrowser\s*\}\s*from\s*["']\.\/safariDetection["']/
    );
    expect(standaloneEntry).toMatch(/markSafariBrowser\(\)/);
    expect(appSource).not.toMatch(/safariDetection|markSafariBrowser/);
    expect(embedEntry).not.toMatch(/safariDetection|markSafariBrowser/);
  });

  test("does not apply standalone scaling or theme globals in embed mode", () => {
    expect(appSource).not.toMatch(/import\s+["']\.\/index\.css["']/);
    expect(standaloneEntry).toMatch(/import\s+["']\.\/index\.css["']/);
    expect(appSource).toContain("solid-health-app--");
    expect(themeStyles).not.toMatch(/(^|[},]\s*)(:root|html|body|#root)\s*[{,]/m);
    expect(themeStyles).toMatch(/\.solid-health-app\s*\{/);
    expect(styles).not.toMatch(/(^|[},]\s*)#root\s*\{[^}]*transform\s*:/s);
    expect(styles).not.toMatch(/(^|[},]\s*)body\s*>\s*#root\s*\{[^}]*transform\s*:/s);
  });
});
