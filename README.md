
# Cotopaxi
Project to develop a Strava-like platform with a USP aimed at long distance path users.  First phase will aim to implement
route planning experience with tools targeted at ultra-runners and long distance walkers/runners.
<p>
This second generation is a ground up rewrite of Aconcagua implementing what I learned the first time around
The plan this time is to develop mature(ish) features deployed to the internet rather than a fully
featured but buggy experience that only works on my desktop.<br>
See the site live here: https://thetrailproject.co.uk/trailscape (NOT YET LIVE)<br>This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.8.


# List of dependencies
This time around I'm going to try and keep better track of my dependencies to avoid some of the mess I
got into last time when trying to develop on a different computer.<br>
<table>
    <tr>
        <td>npm i bootstrap</td>
        <td>front-end component library https://getbootstrap.com</td>
    </tr>
    <tr>
        <td>npm i jquery</td>
        <td>bootstrap dependency</td>
    </tr>
    <tr>
        <td>npm i popper</td>
        <td>bootstrap dependency</td>
    </tr>
    <tr>
        <td>npm i mapbox-gl</td>
        <td>https://www.npmjs.com/package/mapbox-gl</td>
    </tr>
    <tr>
        <td>npm i @types/mapbox-gl</td>
        <td>https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/mapbox-gl</td>
    </tr>    
    <tr>
        <td>npm i @turf/turf</td>
        <td>mapbox doesn't have its own geospatial agorithms http://turfjs.org/</td>
    </tr> 
</table>