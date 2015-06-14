#!/usr/bin/env ruby

def open_file(f)
  return File.open(f).read
end

def write_file(f, data)
  fh = File.open(f, 'w')
  fh.write(data)
end

def fix_media_query(css)
  return css.gsub(/(and|or)\(/, '\1 (')
end

ARGV.each do |a|
  if a.match('\.css$')
    css = fix_media_query(open_file(a))
    write_file(a, css)
  end
end  

