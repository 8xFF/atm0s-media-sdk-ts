#!/bin/bash

PROTO_SRC=./protobuf
PROTO_DIR=./src/generated/protobuf

protoc -I=${PROTO_SRC} \
    --plugin=node_modules/ts-proto/protoc-gen-ts_proto \
    --ts_proto_out=${PROTO_DIR} \
    ${PROTO_SRC}/*.proto
