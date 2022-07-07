awk -F'\t' 'BEGIN{print "module.exports.TOKENS = ["} {print "\t{\n\t\t\"address\":\""$1"\"\n\t},"} END{ print "]"}' config/defaultlist.token.data > config/defaultlist.token.js
