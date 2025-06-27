import fetch from "node-fetch"

commands.add({
    name: ["gitclone"],
    command: ["gitclone"],
    alias: ["githubclone", "git"],
    category: "downloader",
    usage: "<repository>",
    desc: "Direct downloader for GitHub repositories!",
    limit: 10,
    query: true,
    example: "https://github.com/siuspsrb/Itsuki-Bot",
    run: async ({ sius, m, text, args, Func, dl }) => {
        const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
        const link = text.trim();
        
        if (!regex.test(link)) return m.reply("Invalid link!");
        
        // Extract user and repo from the URL
        let [, user, repo] = args[0].match(regex) || [];
        repo = repo.replace(/\.git$/, "");
        
        const url = `https://api.github.com/repos/${user}/${repo}/zipball`;
        
        try {
            // Fetch HEAD to get filename from headers
            const response = await fetch(url, { method: "HEAD" });
            const contentDisposition = response.headers.get("content-disposition");
            
            let filename = "repository.zip"; // fallback filename
            if (contentDisposition) {
                const match = contentDisposition.match(/attachment; filename=(.*)/);
                if (match) filename = match[1];
            }
            
            await m.reply("[√] Cloning repository...");
            
            // Send the zip file as document
            await m.reply({
                document: { url: url },
                fileName: filename,
                mimetype: "application/zip"
            });
        } catch (error) {
            sius.cantLoad(error);
        }
    }
});