#!/bin/bash

PROTO_SRC=./lib/protobuf
PROTO_DIR=./lib/generated/protobuf

protoc -I=${PROTO_SRC} \
    --plugin=node_modules/ts-proto/protoc-gen-ts_proto \
    --ts_proto_out=${PROTO_DIR} \
    ${PROTO_SRC}/*.proto
