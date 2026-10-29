#!/bin/bash
# Log potentially dangerous commands
PS1_orig=$PS1
PS1='[\u@\h \w]$\? \$ '
trap 'echo "$(date -Iseconds) COMMAND: $BASH_COMMAND (uid=$(id -u))" >> /var/log/msbross_dangerous_commands.log' DEBUG
