import { createWriteStream, ensureFileSync, existsSync } from 'fs-extra';
import { request as requestHTTP } from 'http';
import { request as requestHTTPS } from 'https';
import { filesize } from "filesize";
import path from 'path';

const comfyPath = path.resolve(__dirname, '../comfy-ui');

export const downloadDependency = async (type: string, name: string, url: string) => {
  let extension = url.split('.').pop()!;

  if (extension.indexOf('?') !== -1) {
    extension = extension.split('?')[0];
  }

  let escapedName = name;

  if (!name.endsWith(extension)) {
    escapedName = `${name}.${extension}`;
  }

  const useSSL = url.startsWith('https');
  const outputPath = path.resolve(comfyPath + '/models/' + `/${type}/` + escapedName);

  if (existsSync(outputPath)) {
    console.info('pika-gpu', 'dependency already found under', outputPath);

    return;
  }

  ensureFileSync(outputPath);

  const stream = createWriteStream(outputPath);

  console.info('pika-gpu', 'resolving the dependency to', outputPath);

  const downloadFile = async (url: string) => new Promise<string>((resolve, reject) => {
    (useSSL ? requestHTTPS : requestHTTP)(url, async (response) => {
      const responseIsRedirect = [301, 302, 303, 307, 308].includes(response.statusCode!);

      if (responseIsRedirect) {
        const redirectURL = response.headers.location!;

        await downloadFile(redirectURL);

        return resolve('success');
      }

      const downloadSize = parseInt(response.headers['content-length'] ?? '0.0');
      let downloadedSize = 0;
      let downloadInterval = setInterval(() => {
        console.info('pika-gpu', name, `${(downloadedSize / downloadSize * 100).toFixed(2)}%`, `(${filesize(downloadedSize)} of ${filesize(downloadSize)})`);
      }, 1000);

      if (downloadSize === 0) {
        console.info('pika-gpu', name, 'unable to fetch the dependency', 'zero-size file found');

        return reject('failed');
      }

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
      });

      response.on('error', (error) => {
        console.info('pika-gpu', name, 'unable to fetch the dependency', error);

        clearInterval(downloadInterval);

        return reject('failed');
      });

      response.on('end', () => {
        console.info('pika-gpu', name, `100.0%`, `(${filesize(downloadSize)} of ${filesize(downloadSize)})`);

        clearInterval(downloadInterval);

        return resolve('success');
      });

      response.pipe(stream);
    }).end();
  });

  await downloadFile(url);
};
