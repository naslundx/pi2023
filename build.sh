#!/bin/sh

echo "Building...";
mkdir -p public/
# cp static/* public/
for file in src/*
do
  base_name=$(basename ${file})
  echo $base_name
  minify "$file" > "public/$base_name"
done
echo "Done.";
