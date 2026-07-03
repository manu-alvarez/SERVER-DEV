#!/bin/bash
# Wrapper to connect or execute commands on the VPS
ssh -i ~/.ssh/contabo_key -o StrictHostKeyChecking=no ubuntu@84.247.186.126 "$@"
