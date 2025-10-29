/**
 * Store configuration - Initialize Immer plugins and other store setup
 */

import { enableMapSet } from 'immer';

// Enable MapSet support for Immer across all stores
// This allows Immer to properly handle Map and Set objects in state
enableMapSet();
