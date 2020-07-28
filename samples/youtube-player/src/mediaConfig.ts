/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface ImageConfig {
    imageUrl: string;
    skipAfter: number;
}

export interface VideoConfig {
    videoUrl: string;
    skipAfter: number;
    volume: number;
    startTime: number;
    loop: boolean;
    rolloffStartDistance: number;
}