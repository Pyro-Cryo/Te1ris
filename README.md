# Te1ris
Tetris i E1

## TODO
- [x] Påssystem för slumpade tetrominos (alla sju kommer i en slumpad ordning, sen i en ny slumpad ordning, etc. istället för att de väljs oberoende av varandra)
- [ ] Ta en bättre bild i E1
- [ ] Animationer för Föhsare + ljungeldsblick när en rad försvinner
- [ ] Visa vilken nästa tetromino är
- [ ] Poängsystem
- [ ] Touchkontroller
- [ ] Fixa några specialblock (vanliga faddrar med effekter, typ solglasögon)
    - [ ] Frågvisa Fadderister som hela tiden försöker flytta sig närmare tavlan
    - [ ] Föhsare som gör att rader inte kan clearas förrän Föhsarnas rad clearas (dyker upp som en horisontell ShapeI)
    - [ ] Alternativt en ensam Föhsare som kommer och sätter sig mitt i 
    - [ ] Fadder med solglasögon som överlever att deras rad clearas en gång (de tappar solglasögonen och clearas som vanligt nästa gång)
    - [ ] "Dryg" fadder som breder ut sig till de två platserna bredvid, om de kan (försök sätta dessa i enblockshål för att de inte ska kunna breda ut sig)
    - [ ] Fadder som råkat ta fel sal, och som reser sig och går efter ett visst antal shapes (jobbigt om de kommer långt ner och skapar hål som inte går att täppa)
- [ ] Om det ska vara faddrar som går ut och in / flyttar sig mellan platser vore det kanske bra att kunna animera förflyttningar mellan platser
- [ ] Något slags level progression som introducerar svårare faddrar ju längre man spelar
    - Kan förmodligen baseras på det från campus defence / nollejump
    - Inkludera pauser (bara första gången man spelar?) med lore/förklaring av nästa bricka som dyker upp?
    - Går kanske lite snabbare med tiden också? Tänker att den huvudsakliga svårighetsaspekten är de olika sorternas faddrar dock
- [ ] Holdsystem för tetrominos (kan sätta den fallande tetrominon åt sidan och byta ut mot en tidigare åsidosatt tetromino)
- [ ] Fixa så att ShapeI kan rotera från vertikal till horisontell även när den är nära väggarna (förhoppningsvis bara att lägga till en pivot point)