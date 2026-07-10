#!/bin/bash
# Wrapper to connect or execute commands on the VPS
VPS_HOST="${VPS_HOST:-100.100.1.10}"
ssh -i ~/.ssh/contabo_key -o StrictHostKeyChecking=no ubuntu@$VPS_HOST "$@"
