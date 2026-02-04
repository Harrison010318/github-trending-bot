#!/bin/bash
# 测试脚本 - 带代理的测试

export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890

npm run test:save "$@"
