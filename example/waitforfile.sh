#!/bin/bash
rm -f "$1"
echo Waiting for $1
while [ ! -f "$1" ]; do sleep 1; done
