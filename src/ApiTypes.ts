/*
 * Docker Registry Browser
 * Copyright (c) 2022 phidevz
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface Catalog {
    repositories: string[]
}

export interface TagList {
    name: string,
    tags: string[]
}

export interface Manifest {
    schemaVersion: number,
    name: string,
    tag: string,
    architecture: string,
    fsLayers: FsLayer[],
    history: HistoryEntry[],
    signatures: Signature[]
}

export interface FsLayer {
    blobSum: string,
    blobSize: number,
    blobPath: string
}

export interface HistoryEntry {
    v1Compatibility: V1CompatibleHistoryEntry
}

export interface V1CompatibleHistoryEntry {
    id: string,
    parent: string,
    throwaway: boolean,
    created: Date,
    container_config: ContainerConfig
}

export interface ContainerConfig {
    Cmd: ContainerConfigCommand[]
}

export type ContainerConfigCommand = string;

export interface Signature {
    header: SignatureHeader,
    signature: string,
    protected: string
}

export interface SignatureHeader {
    jwk: Jwk,
    alg: string
}

export interface Jwk {
    crv: string,
    kid: string,
    kty: string,
    x: string,
    y: string
}

interface RawManifest {
    schemaVersion: number,
    name: string,
    tag: string,
    architecture: string,
    fsLayers: RawFsLayer[],
    history: RawHistoryEntry[],
    signatures: Signature[]
}

interface RawFsLayer {
    blobSum: string
}

interface RawHistoryEntry {
    v1Compatibility: string
}

const options: RequestInit = {
    mode: 'cors',
    referrer: '',
    referrerPolicy: 'no-referrer'
};

export class RegistryApi {

    private baseUri: string;

    constructor(baseUri: string) {
        while (baseUri.endsWith("/")) {
            baseUri = baseUri.substring(0, baseUri.length - 1);
        }
        this.baseUri = baseUri;
    }

    async isApiVersionSupported(): Promise<boolean> {
        const result = await fetch(`${this.baseUri}/`, options);

        return result.headers.get("docker-distribution-api-version") === "registry/2.0";
    }

    async getTags(repository: string): Promise<TagList> {
        const result = await fetch(`${this.baseUri}/${repository}/tags/list`, options);

        const json = await result.json();

        return json as TagList;
    }

    async getManifest(repository: string, reference: string): Promise<Manifest> {
        const result = await fetch(`${this.baseUri}/${repository}/manifests/${reference}`, options);

        const json = await result.json();

        const rawManifest = json as RawManifest;

        const fsLayers = await Promise.all(rawManifest.fsLayers.map(async fsLayer => {
            const blobPath = `${this.baseUri}/${repository}/blobs/${fsLayer.blobSum}`;
            const blobHead = await fetch(blobPath, { ...options, method: 'HEAD' });

            return {
                blobSum: fsLayer.blobSum,
                blobSize: parseInt(blobHead.headers.get("content-length")!),
                blobPath: blobPath
            } as FsLayer
        }));

        return {
            architecture: rawManifest.architecture,
            fsLayers: fsLayers,
            name: rawManifest.name,
            schemaVersion: rawManifest.schemaVersion,
            signatures: rawManifest.signatures,
            tag: rawManifest.tag,
            history: rawManifest.history.map(entry => { return { v1Compatibility: JSON.parse(entry.v1Compatibility) as V1CompatibleHistoryEntry } as HistoryEntry })
        } as Manifest;
    }

    async getCatalog(): Promise<Catalog> {
        const result = await fetch(`${this.baseUri}/_catalog`, options);

        const json = await result.json();

        return json as Catalog;
    }
}
