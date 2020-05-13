
const strISODateBR = function(data) {
  return data.toISOString().replace(/(\d{4})-(\d{2})-(\d{2}).*/g, '$3/$2/$1')
}

module.exports = {
  strISODateBR: strISODateBR
}
