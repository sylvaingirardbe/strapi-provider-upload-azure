'use strict';

/**
 * Module dependencies
 */

/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require('lodash');
const fs = require('fs');
const streamifier = require('streamifier');
const azurestorage = require('azure-storage');

const azureTypes = {
  base: {
    label: 'Azure Cloud',
    url: 'windows.net'
  },
  china: {
    label: 'Azure China Cloud',
    url: 'chinacloudapi.cn',
  }
};

module.exports = {
  provider: 'azure',
  name: 'Azure Storage',
  auth: {
    connectionString: {
      label: 'Connection string',
      type: 'text'
    },
    account: {
      label: 'Account',
      type: 'text'
    },
    container: {
      label: 'Container',
      type: 'text'
    },
    azureType: {
      label: 'Azure Type',
      type: 'enum',
      values: [azureTypes.base.label, azureTypes.china.label]
    }
  },
  init: (config) => {
    const blobService = azurestorage.createBlobService(config.connectionString);
    const azureTypeUrl = azureTypes.find(x => x.label === config.azureType);

    return {
      upload: (file) => {
        return new Promise((resolve, reject) => {
          const fileStream = streamifier.createReadStream(file.buffer);
          const filename = `${file.hash}${file.ext}`;
          const writeStream = blobService.createWriteStreamToBlockBlob(
            config.container,
            filename,
            {
              contentSettings: {
                contentType: file.mime
              }
            },
            (err, res) => {
              if (err) {
                reject(err);
              }
            },
          );
          fileStream.pipe(writeStream).on('finish', () => {
            file.url = `https://${config.account}.blob.core.${azureTypeUrl || azureTypes.base}/${config.container}/${filename}`;
            resolve({ message: `Upload of '${filename}' complete.` });
          });
        });
      },
      delete: (file) => {
        return new Promise((resolve, reject) => {
          const filename = `${file.hash}${file.ext}`;
          blobService.deleteBlobIfExists(
            config.container,
            filename,
            (err, res) => {
              if (err) {
                reject(err);
              }
              resolve();
            },
          );
        });
      }
    };
  }
};
