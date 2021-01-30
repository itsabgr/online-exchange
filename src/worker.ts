import {} from ''
addEventListener( "fetch", event =>
{
    event.respondWith( fetchAndInclude( event.request ) )
} )

async function fetchAndInclude ( request ) { }