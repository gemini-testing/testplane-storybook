import net from "net";

export const isPortBusy = (port: number): Promise<boolean> =>
    new Promise(resolve => {
        const server = net.createServer();

        server.unref();
        server.on("error", () => resolve(true));
        server.listen(port, () => {
            server.close();

            resolve(false);
        });
    });
