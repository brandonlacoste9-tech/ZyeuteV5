async function testLocalApi() {
  try {
    const resp = await fetch("http://localhost:3000/api/feed?hive=quebec");
    const data = await resp.json();
    
    console.log(`Fetched ${data.posts?.length} posts.`);
    const mixkitPosts = data.posts?.filter(p => p.media_url?.includes("mixkit"));
    
    console.log(`Found ${mixkitPosts?.length} mixkit posts in local API response.`);
    if (mixkitPosts?.length > 0) {
      console.log(mixkitPosts[0].media_url);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testLocalApi();
