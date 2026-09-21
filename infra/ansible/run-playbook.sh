#!/usr/bin/env bash
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
exec /home/aparichit/.local/bin/ansible-playbook "$@"
