import { Alert, Table } from "antd";
import { ColumnsType } from "antd/lib/table";
import { FsLayer, HistoryEntry } from "../ApiTypes"

interface Tuple {
    order: number,
    cmd: string,
    fsLayer: FsLayer
}

function normalizeCommand(cmd: string): string {
    const shStr = "/bin/sh -c ";
    const nopStr = "#(nop) ";

    if (!cmd.startsWith(shStr)) {
        return cmd;
    }

    cmd = cmd.substring(shStr.length);

    if (cmd.startsWith(nopStr)) {
        return cmd.substring(nopStr.length);
    }

    return "RUN " + cmd;
}

export default function ImageLayers(props: { history: HistoryEntry[], fsLayers: FsLayer[] }) {
    const history = props.history.reverse();
    const fsLayers = props.fsLayers.reverse();

    if (history.length !== fsLayers.length) {
        return (<>
            <Alert message="Image History and Filesystem Layers' length do not match" type="error" />
        </>);
    }

    const entries = history.map((historyEntry, index) => {
        return {
            order: index + 1,
            cmd: normalizeCommand(historyEntry.v1Compatibility.container_config.Cmd.map(cmd => cmd.trim()).join(" ")),
            fsLayer: fsLayers[index]
        } as Tuple
    });

    const columns: ColumnsType<Tuple> = [
        {
            title: "Order",
            dataIndex: "order"
        },
        {
            title: "Blob",
            dataIndex: ["fsLayer", "blobSum"]
        },
        {
            title: "Command",
            dataIndex: "cmd",
            className: "manifest-command"
        }
    ];

    return (<Table dataSource={entries} columns={columns} />)
}