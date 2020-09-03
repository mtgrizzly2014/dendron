#!/bin/bash

echo "building..."
npx lerna run build --scope @dendronhq/common-all
npx lerna run build --scope @dendronhq/common-server
npx lerna run build --scope @dendronhq/engine-server
npx lerna run build --scope @dendronhq/dendron-cli
npx lerna run build --scope @dendronhq/pods-core
npx lerna run build --scope @dendronhq/plugin-core
