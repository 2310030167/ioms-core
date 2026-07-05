console.log("⚡ Hook live");

onRecordAfterUpdateSuccess((e) => {
    try {
        const url = "http://ioms-n8n:5678/webhook-test/cbf8a031-2b7f-4e07-8677-b08251ec5f18";
        $http.send({
            url: url,
            method: "POST",
            body: JSON.stringify({
                id: e.record.id,
                name: e.record.get("name") || e.record.get("Name"),
                status: e.record.get("Status") || e.record.get("status")
            }),
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.log("❌ Err: " + err);
    }
    e.next();
}, "projects");