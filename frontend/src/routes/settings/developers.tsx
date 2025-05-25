import { SelectDevExtension } from "@/components/settings/drag_and_drop";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { SquareArrowUpRight } from "lucide-react";

export type ExtJson = {
  clutch: Clutch;
};

type Clutch = {
  name: string;
  description: string;
  longDescription: string;
  dev: Dev;
};

type Dev = {
  distDir: string;
  devUrl: string;
};

export const Route = createFileRoute("/settings/developers")({
  component: RouteComponent,
});

function RouteComponent() {
  const [devExtension, setDevExtension] = useState<ExtJson>();

  return (
    <div>
      <div className="flex flex-col gap-2">
        <span>Add Dev Extension</span>
        <SelectDevExtension setDevExtension={setDevExtension} />
      </div>
      {devExtension && (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>{devExtension?.clutch.name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>{devExtension?.clutch.description}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Long Description</TableCell>
              <TableCell>{devExtension?.clutch.longDescription}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Dist dir</TableCell>
              <TableCell>{devExtension?.clutch.dev.distDir}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Dev Url</TableCell>
              <TableCell>
                <Link
                  to="/extension/dev/$extension"
                  params={{ extension: devExtension.clutch.dev.devUrl }}
                  className="underline"
                >
                  <span className="flex items-center justify-start gap-2">
                    {devExtension?.clutch.dev.devUrl}
                    <SquareArrowUpRight size={16} />
                  </span>
                </Link>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}
