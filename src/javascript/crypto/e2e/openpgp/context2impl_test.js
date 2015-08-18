/**
 * @license
 * Copyright 2013 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Tests for Context2 implementation.
 */

/** @suppress {extraProvide} */
goog.provide('e2e.openpgp.Context2ImplTest');

goog.require('e2e');
goog.require('e2e.openpgp.ClearSignMessage');
goog.require('e2e.openpgp.Context2Impl');
goog.require('e2e.openpgp.KeyPurposeType');
goog.require('e2e.openpgp.KeyRingType');
goog.require('e2e.openpgp.SimpleKeyManager');
goog.require('e2e.openpgp.asciiArmor');
goog.require('e2e.openpgp.block.EncryptedMessage');
goog.require('e2e.openpgp.block.LiteralMessage');
goog.require('e2e.openpgp.block.factory');
goog.require('e2e.openpgp.error.Error');
goog.require('e2e.openpgp.packet.PKEncryptedSessionKey');
goog.require('e2e.openpgp.packet.SymmetricKey');
goog.require('goog.Promise');
goog.require('goog.crypt');
goog.require('goog.string');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.MockClassFactory');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.mockmatchers');
goog.setTestOnly();


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var contextPromise;
var keyManagerMock;
var mockClassFactory;
var PLAINTEXT = 'hello. test.';

function setUp() {
  mockClassFactory = new goog.testing.MockClassFactory();
  keyManagerMock = mockClassFactory.getStrictMockClass(e2e.openpgp,
      e2e.openpgp.SimpleKeyManager);
  contextPromise = e2e.openpgp.Context2Impl.launch(
      goog.Promise.resolve(keyManagerMock));
}

function tearDown() {
  mockClassFactory.reset();
}


function testConstructor() {
  asyncTestCase.waitForAsync('Waiting for async call.');

  contextPromise.then(function(context) {
    assertTrue(context instanceof e2e.openpgp.Context2Impl);
    asyncTestCase.continueTesting();
  });
}

function testKeyManagerProxyMethods() {
  var key = 'A_KEY';
  var email = 'email@example.com';
  var provider = 'testProvider';
  var fingerprint = 'fingerprint';
  var credentials = 'creds';
  var options = 'dummy';
  var returnValueCount = 0;
  var expectedReturnValueCount = 0;

  keyManagerMock.getTrustedKeys(e2e.openpgp.KeyPurposeType.ENCRYPTION, email).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.getAllKeys(e2e.openpgp.KeyRingType.SECRET, provider).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.getAllKeys(e2e.openpgp.KeyRingType.PUBLIC, provider).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.getKeyByFingerprint(fingerprint, provider).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.setProviderCredentials(provider, credentials).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.getAllKeyGenerateOptions().
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.generateKeyPair(email, options).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.getKeyringExportOptions(e2e.openpgp.KeyRingType.PUBLIC).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.exportKeyring(e2e.openpgp.KeyRingType.PUBLIC, options).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.trustKeys(
      [key], email, e2e.openpgp.KeyPurposeType.ENCRYPTION, options).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.unlockKey(key, options).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.importKeys([], options).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.importKeys([0], options).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.getAllKeysByEmail(email).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.removeKeys([key]).
      $returns(goog.Promise.resolve(returnValueCount++));
  keyManagerMock.removeKeys([key]).
      $throws(new Error('Dummy error.'));

  keyManagerMock.$replay();

  asyncTestCase.waitForAsync('Waiting for async call.');

  var context = new e2e.openpgp.Context2Impl(keyManagerMock);

  context.getTrustedKeys(e2e.openpgp.KeyPurposeType.ENCRYPTION, email)
      .then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.getAllSecretKeys(provider);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.getAllPublicKeys(provider);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.getKeyByFingerprint(fingerprint, provider);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.setProviderCredentials(provider, credentials);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.getAllKeyGenerateOptions();
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.generateKeyPair(email, options);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.getKeyringExportOptions(e2e.openpgp.KeyRingType.PUBLIC);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.exportKeyring(e2e.openpgp.KeyRingType.PUBLIC, options);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.trustKeys([key], email,
            e2e.openpgp.KeyPurposeType.ENCRYPTION, options);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.unlockKey(key, options);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.importKeys(key, options);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.importKeys([0], options);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.getAllKeysByEmail(email);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.removeKeys([key]);
      }).then(function(res) {
        assertEquals(expectedReturnValueCount++, res);
        return context.removeKeys([key]); // This will throw an error.
      }).then(fail, function(error) {
        assertTrue(error instanceof Error);
        keyManagerMock.$verify();
        asyncTestCase.continueTesting();
      });
}


function testGetKeysDescription() {
  var context;
  var twoKeyBlocks = document.getElementById('twoKeyBlocks').value;
  asyncTestCase.waitForAsync('Waiting for first import of key.');
  contextPromise.then(function(c) {
    context = c;
    return context.getKeysDescription(twoKeyBlocks);
  }, fail).then(function(description) {
    assertEquals(2, description.length);
    assertEquals('13ea2f602577fba20f428af1b2f39422e42c5ea7',
        goog.crypt.byteArrayToHex(description[0].key.fingerprint));
    assertEquals('13EA 2F60 2577 FBA2 0F42  8AF1 B2F3 9422 E42C 5EA7',
        description[0].key.fingerprintHex);
    assertEquals('ECDSA', description[0].key.algorithm);
    assertContains('<key1>', description[0].uids);
    assertEquals(false, description[0].key.secret);
    assertEquals('ECDH', description[0].subKeys[0].algorithm);
    assertContains('<key2>', description[1].uids);
    assertEquals('14B7 EF7A 0A02 074E 5C7F  50C7 537B 85C1 72B7 F7E2',
        description[1].key.fingerprintHex);
    assertEquals(false, description[1].key.secret);
    asyncTestCase.waitForAsync('waiting for getKeyDescription');
    return context.getKeysDescription('invalid value');
  }, fail).then(fail, function(e) {
    assertTrue(e instanceof e2e.openpgp.error.Error);
    asyncTestCase.continueTesting();
  });
}


function testEncryptToKeyNoSign() {
  // TODO(koto): Add decryption test when secret keys support arrives.
  var context;
  var EMAIL = 'test@example.com';
  var publicKeyAscii = document.getElementById('e2ePubKeyAscii').value;
  var publicKey = e2e.openpgp.block.factory.parseAsciiAllTransferableKeys(
      publicKeyAscii)[0];

  keyManagerMock.getTrustedKeys(e2e.openpgp.KeyPurposeType.ENCRYPTION, EMAIL).
      $returns(goog.Promise.resolve([{
        uids: [EMAIL],
        key: {
          secret: false,
          algorithm: 'DUMMY',
          fingerprintHex: '',
          fingerprint: []
        },
        subKeys: [],
        serialized: publicKey.serialize(),
        providerId: 'Test'
      }]));

  keyManagerMock.$replay();

  asyncTestCase.waitForAsync('Waiting for encryption.');
  contextPromise.then(function(c) {
    context = c;
    return context.getTrustedKeys(e2e.openpgp.KeyPurposeType.ENCRYPTION, EMAIL);
  }, fail).then(function(encryptionKeys) {
    return context.encryptSign(PLAINTEXT, {}, encryptionKeys, [], []);
  }, fail).then(function(ciphertext) {
    assertTrue(goog.string.startsWith(ciphertext,
        '-----BEGIN PGP MESSAGE-----\r\n'));
    assertTrue(goog.string.endsWith(ciphertext,
        '-----END PGP MESSAGE-----\r\n'));
    var message = e2e.openpgp.block.factory.parseAsciiMessage(ciphertext);
    assertTrue(message instanceof e2e.openpgp.block.EncryptedMessage);
    assertEquals(1, message.eskPackets.length);
    assertTrue(message.eskPackets[0] instanceof
        e2e.openpgp.packet.PKEncryptedSessionKey);
    assertArrayEquals(message.eskPackets[0].keyId, publicKey.subKeys[0].keyId);
    keyManagerMock.$verify();
    asyncTestCase.continueTesting();
  }, fail);
}


function testEncryptToPassphraseNoSign() {
  // TODO(koto): Add decryption test.
  var context;

  asyncTestCase.waitForAsync('Waiting for first import of key.');
  contextPromise.then(function(c) {
    context = c;
    return context.encryptSign(PLAINTEXT, {}, [], ['passphrase'], []);
  }, fail).then(function(ciphertext) {
    assertTrue(goog.string.startsWith(ciphertext,
        '-----BEGIN PGP MESSAGE-----\r\n'));
    assertTrue(goog.string.endsWith(ciphertext,
        '-----END PGP MESSAGE-----\r\n'));
    var message = e2e.openpgp.block.factory.parseAsciiMessage(ciphertext);
    assertTrue(message instanceof e2e.openpgp.block.EncryptedMessage);
    assertEquals(1, message.eskPackets.length);
    assertTrue(message.eskPackets[0] instanceof
        e2e.openpgp.packet.SymmetricKey);
    asyncTestCase.continueTesting();
  }, fail);
}


function testEncryptToPassphraseSign() {
  // TODO(koto): Add decryption test.
  var context;
  var EMAIL = 'test@example.com';

  var privKeyAscii = document.getElementById('e2ePrivKeyAscii').value;

  var privateKey = e2e.openpgp.block.factory.parseAsciiAllTransferableKeys(
      privKeyAscii)[0];
  privateKey.processSignatures();
  privateKey.getKeyToSign().cipher.unlockKey();
  var cipher = privateKey.getKeyToSign().cipher.getWrappedCipher();

  var keyObject = {
    uids: [EMAIL],
    key: {
      secret: true,
      algorithm: 'DUMMY',
      fingerprintHex: '',
      fingerprint: []
    },
    subKeys: [],
    serialized: null,
    providerId: 'Test',
    signingKeyId: privateKey.getKeyToSign().keyId,
    signAlgorithm: cipher.algorithm,
    signHashAlgorithm: cipher.getHashAlgorithm()
  };

  keyManagerMock.getTrustedKeys(e2e.openpgp.KeyPurposeType.SIGNING, EMAIL).
      $returns(goog.Promise.resolve([keyObject]));

  keyManagerMock.sign(keyObject, keyObject.signingKeyId, cipher.algorithm,
      cipher.getHashAlgorithm(),
      goog.testing.mockmatchers.ignoreArgument).
      $does(function(key, keyId, signAlgo, hashAlgo, data) {
        return cipher.sign(data);
      });

  keyManagerMock.$replay();

  asyncTestCase.waitForAsync('Waiting for first import of key.');
  contextPromise.then(function(c) {
    context = c;
    return context.getTrustedKeys(e2e.openpgp.KeyPurposeType.SIGNING, EMAIL);
  }, fail).then(function(signingKeys) {
    return context.encryptSign(PLAINTEXT, {}, [], ['passphrase'], signingKeys);
  }, fail).then(function(ciphertext) {
    assertTrue(goog.string.startsWith(ciphertext,
        '-----BEGIN PGP MESSAGE-----\r\n'));
    assertTrue(goog.string.endsWith(ciphertext,
        '-----END PGP MESSAGE-----\r\n'));
    var message = e2e.openpgp.block.factory.parseAsciiMessage(ciphertext);
    assertTrue(message instanceof e2e.openpgp.block.EncryptedMessage);
    assertEquals(1, message.eskPackets.length);
    assertTrue(message.eskPackets[0] instanceof
        e2e.openpgp.packet.SymmetricKey);
    keyManagerMock.$verify();
    asyncTestCase.continueTesting();
  }, fail);
}


function testClearSign() {
  // TODO(koto): Add decryption test.
  var context;
  var EMAIL = 'test@example.com';

  var privKeyAscii = document.getElementById('e2ePrivKeyAscii').value;

  var privateKey = e2e.openpgp.block.factory.parseAsciiAllTransferableKeys(
      privKeyAscii)[0];
  privateKey.processSignatures();
  privateKey.getKeyToSign().cipher.unlockKey();
  var cipher = privateKey.getKeyToSign().cipher.getWrappedCipher();
  var publicKeyAscii = document.getElementById('e2ePubKeyAscii').value;
  var publicKey = e2e.openpgp.block.factory.parseAsciiAllTransferableKeys(
      publicKeyAscii)[0];

  var keyObject = {
    uids: [EMAIL],
    key: {
      secret: true,
      algorithm: 'DUMMY',
      fingerprintHex: '',
      fingerprint: []
    },
    subKeys: [],
    serialized: null,
    providerId: 'Test',
    signingKeyId: privateKey.getKeyToSign().keyId,
    signAlgorithm: cipher.algorithm,
    signHashAlgorithm: cipher.getHashAlgorithm()
  };

  keyManagerMock.getTrustedKeys(e2e.openpgp.KeyPurposeType.SIGNING, EMAIL).
      $returns(goog.Promise.resolve([keyObject]));

  keyManagerMock.sign(keyObject, keyObject.signingKeyId, cipher.algorithm,
      cipher.getHashAlgorithm(),
      goog.testing.mockmatchers.ignoreArgument).
      $does(function(key, keyId, algo, hashAlgo, data) {
        return cipher.sign(data);
      });

  keyManagerMock.$replay();

  asyncTestCase.waitForAsync('Waiting for first import of key.');
  contextPromise.then(function(c) {
    context = c;
    return context.getTrustedKeys(e2e.openpgp.KeyPurposeType.SIGNING, EMAIL);
  }, fail).then(function(signingKeys) {
    return context.encryptSign(PLAINTEXT, {}, [], [], signingKeys);
  }, fail).then(function(ciphertext) {
    assertTrue(goog.string.startsWith(ciphertext,
        '-----BEGIN PGP SIGNED MESSAGE-----\r\n'));
    assertTrue(goog.string.endsWith(ciphertext,
        '-----END PGP SIGNATURE-----\r\n'));
    var message = e2e.openpgp.asciiArmor.parseClearSign(ciphertext);
    assertTrue(message instanceof e2e.openpgp.ClearSignMessage);
    assertEquals(PLAINTEXT, message.getBody());
    assertArrayEquals(publicKey.keyPacket.keyId,
        message.getSignature().getSignerKeyId());
    keyManagerMock.$verify();
    asyncTestCase.continueTesting();
  }, fail);
}


function testByteSign() {
  // TODO(koto): Add decryption test.
  var context;
  var EMAIL = 'test@example.com';

  var privKeyAscii = document.getElementById('e2ePrivKeyAscii').value;

  var privateKey = e2e.openpgp.block.factory.parseAsciiAllTransferableKeys(
      privKeyAscii)[0];
  privateKey.processSignatures();
  privateKey.getKeyToSign().cipher.unlockKey();
  var cipher = privateKey.getKeyToSign().cipher.getWrappedCipher();
  var publicKeyAscii = document.getElementById('e2ePubKeyAscii').value;
  var publicKey = e2e.openpgp.block.factory.parseAsciiAllTransferableKeys(
      publicKeyAscii)[0];

  var keyObject = {
    uids: [EMAIL],
    key: {
      secret: true,
      algorithm: 'DUMMY',
      fingerprintHex: '',
      fingerprint: []
    },
    subKeys: [],
    serialized: null,
    providerId: 'Test',
    signingKeyId: privateKey.getKeyToSign().keyId,
    signAlgorithm: cipher.algorithm,
    signHashAlgorithm: cipher.getHashAlgorithm()
  };

  keyManagerMock.getTrustedKeys(e2e.openpgp.KeyPurposeType.SIGNING, EMAIL).
      $returns(goog.Promise.resolve([keyObject]));

  keyManagerMock.sign(keyObject, keyObject.signingKeyId, cipher.algorithm,
      cipher.getHashAlgorithm(),
      goog.testing.mockmatchers.ignoreArgument).
      $does(function(key, keyId, algo, hashAlgo, data) {
        return cipher.sign(data);
      });

  keyManagerMock.$replay();

  asyncTestCase.waitForAsync('Waiting for first import of key.');
  contextPromise.then(function(c) {
    context = c;
    return context.setArmorOutput(false);
  }, fail).then(function() {
    return context.getTrustedKeys(e2e.openpgp.KeyPurposeType.SIGNING, EMAIL);
  }, fail).then(function(signingKeys) {
    return context.encryptSign(PLAINTEXT, {}, [], [], signingKeys);
  }, fail).then(function(ciphertext) {
    var message = e2e.openpgp.block.factory.parseByteArrayMessage(ciphertext);
    assertTrue(message instanceof e2e.openpgp.block.LiteralMessage);
    assertEquals(1, message.signatures.length);
    assertArrayEquals(publicKey.keyPacket.keyId,
        message.getSignatureKeyIds()[0]);
    keyManagerMock.$verify();
    asyncTestCase.continueTesting();
  }, fail);
}
