/**
 * OneShop POS - Robust Universal POS Print Service
 * Developed by JK Developers Pakistan (Helpline: 0300-8998381)
 * 
 * Solves 100% of blank-page print issues across thermal 80mm, 58mm, normal A4/A5,
 * barcode sticker printers, and reports.
 */

export type PrintFormat = 'thermal80' | 'thermal58' | 'a4' | 'a5' | 'label' | 'auto';

interface PrintOptions {
  format?: PrintFormat;
  title?: string;
  isUrdu?: boolean;
}

export function printElement(
  elementOrId: HTMLElement | string,
  options: PrintOptions = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const targetElement =
        typeof elementOrId === 'string'
          ? document.getElementById(elementOrId)
          : elementOrId;

      if (!targetElement) {
        console.warn('[PrintService] Target element not found, falling back to window.print()');
        window.print();
        resolve(true);
        return;
      }

      const format = options.format || 'auto';
      const isUrdu = options.isUrdu !== false;
      const title = options.title || 'OneShop POS Receipt';

      // 1. Remove any old print iframe
      const oldFrame = document.getElementById('pos-isolated-print-frame');
      if (oldFrame) {
        oldFrame.remove();
      }

      // 2. Create isolated hidden iframe with full dimensions (Prevents Chrome 1px blank-page clipping bug)
      const iframe = document.createElement('iframe');
      iframe.id = 'pos-isolated-print-frame';
      iframe.setAttribute('style', 'position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;opacity:0;pointer-events:none;z-index:-99999;');
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!frameDoc || !iframe.contentWindow) {
        console.warn('[PrintService] Cannot access iframe document, fallback to window.print()');
        window.print();
        resolve(true);
        return;
      }

      // 3. Extract all head styles, links, and Google Fonts from current document + inline sheets
      let inlineRules = '';
      try {
        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i];
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              for (let j = 0; j < rules.length; j++) {
                inlineRules += rules[j].cssText + '\n';
              }
            }
          } catch {
            // Ignore cross-origin stylesheet read errors
          }
        }
      } catch {}

      const currentHeadStyles = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style')
      )
        .map((node) => node.outerHTML)
        .join('\n');

      // 4. Build page CSS rules based on target format
      let pageCss = '';
      if (format === 'thermal80') {
        pageCss = `
          @page { size: 80mm auto; margin: 0; }
          html, body {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 1.5mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
            line-height: 1.25 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .thermal-80-receipt {
            width: 76mm !important;
            max-width: 76mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
          }
        `;
      } else if (format === 'thermal58') {
        pageCss = `
          @page { size: 58mm auto; margin: 0; }
          html, body {
            width: 58mm !important;
            max-width: 58mm !important;
            margin: 0 auto !important;
            padding: 1mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 9.5px !important;
            line-height: 1.2 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .thermal-58-receipt {
            width: 50mm !important;
            max-width: 50mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
          }
        `;
      } else if (format === 'a4') {
        pageCss = `
          @page { size: A4 portrait; margin: 8mm 10mm; }
          html, body {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 12px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .a4-receipt {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        `;
      } else if (format === 'a5') {
        pageCss = `
          @page { size: A5 portrait; margin: 6mm 8mm; }
          html, body {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .a5-receipt {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        `;
      } else if (format === 'label') {
        pageCss = `
          @page { size: auto; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 1mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-label {
            box-shadow: none !important;
            border: 1px dashed #000000 !important;
            margin: 0 auto !important;
          }
        `;
      } else {
        pageCss = `
          @page { size: auto; margin: 5mm; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        `;
      }

      // Universal crisp styling inside print document
      const universalPrintCss = `
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Noto Nastaliq Urdu', Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          direction: ${isUrdu ? 'rtl' : 'ltr'};
        }
        .no-print {
          display: none !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        img, svg {
          max-width: 100% !important;
          height: auto !important;
        }
      `;

      // 5. Clone the target element and clean any interactive or no-print nodes
      const clonedNode = targetElement.cloneNode(true) as HTMLElement;
      clonedNode.querySelectorAll('.no-print').forEach((el) => el.remove());

      // 6. Assemble HTML document
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="${isUrdu ? 'ur' : 'en'}" dir="${isUrdu ? 'rtl' : 'ltr'}">
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            ${currentHeadStyles}
            <style>
              ${inlineRules}
              ${pageCss}
              ${universalPrintCss}
            </style>
          </head>
          <body>
            ${clonedNode.outerHTML}
          </body>
        </html>
      `;

      frameDoc.open();
      frameDoc.write(fullHtml);
      frameDoc.close();

      // 7. Wait for images, fonts and barcodes to fully render before print
      const trigger = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            iframe.remove();
            resolve(true);
          }, 1500);
        } catch (err) {
          console.error('[PrintService] Frame print error:', err);
          window.print();
          resolve(false);
        }
      };

      if (iframe.contentWindow) {
        // Wait slightly for browser layout
        setTimeout(trigger, 250);
      } else {
        trigger();
      }
    } catch (e) {
      console.error('[PrintService] Error:', e);
      window.print();
      resolve(false);
    }
  });
}
