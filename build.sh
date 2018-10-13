#!/usr/bin/env bash

node_modules/.bin/rimraf ./build

node_modules/.bin/babel -d ./build/server ./server



