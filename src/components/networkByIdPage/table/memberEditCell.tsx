import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { isIPInSubnet } from "~/utils/isIpInsubnet";
import { convertRGBtoRGBA } from "~/utils/randomColor";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { api } from "~/utils/api";
import Input from "~/components/elements/input";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { type MemberEntity } from "~/types/local/member";
import { toRfc4193Ip, sixPlane } from "~/utils/IPv6";
import {
	useTrpcApiErrorHandler,
	useTrpcApiSuccessHandler,
} from "~/hooks/useTrpcApiHandler";
import { RoutesEntity } from "~/types/local/network";

interface IProp {
	nwid: string;
	central: boolean;
	organizationId?: string;
}

const MemberEditCell = ({ nwid, central = false, organizationId }: IProp) => {
	const t = useTranslations();

	const handleApiError = useTrpcApiErrorHandler();
	const handleApiSuccess = useTrpcApiSuccessHandler();

	const { data: networkById, refetch: refetchNetworkById } =
		api.network.getNetworkById.useQuery(
			{
				nwid,
				central,
			},
			{ enabled: !!nwid },
		);

	const { data: me } = api.auth.me.useQuery();

	const { mutate: updateMember } = api.networkMember.Update.useMutation({
		onError: handleApiError,
		onSuccess: handleApiSuccess({
			actions: [refetchNetworkById],
		}),
	});

	const deleteIpAssignment = (ipAssignments: Array<string>, Ipv4: string, id: string) => {
		const _ipv4 = [...ipAssignments];
		const newIpPool = _ipv4.filter((r) => r !== Ipv4);

		updateMember({
			updateParams: { ipAssignments: [...newIpPool] },
			memberId: id,
			organizationId,
			nwid,
			central,
		});
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const defaultColumn: Partial<ColumnDef<MemberEntity>> = {
		cell: ({ getValue, row: { index, original }, column: { id }, table }) => {
			const initialValue = getValue();
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const inputRef = useRef<HTMLInputElement>(null);

			// We need to keep and update the state of the cell normally
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const [value, setValue] = useState(initialValue);

			// When the input is blurred, we'll call our table meta's updateData function
			const onBlur = () => {
				table.options.meta?.updateData(index, id, value);
			};

			const submitName = (e: React.MouseEvent<HTMLButtonElement>) => {
				e.preventDefault();
				updateMember({
					updateParams: { name: value as string },
					memberId: original.id,
					organizationId,
					nwid,
					central,
				});

				inputRef.current?.blur();
				// updateMyData(index, id, value, original);
			};
			// If the initialValue is changed external, sync it up with our state
			useEffect(() => {
				setValue(initialValue);
			}, [initialValue]);

			if (id === "name") {
				const notations = original.notations || [];
				return (
					<div className="w-full">
						<form className="w-full">
							<div className="flex items-center w-full">
								{!central &&
									me?.options?.showNotationMarkerInTableRow &&
									notations?.map((notation) => (
										<div
											key={notation.label?.name}
											className="flex-shrink-0 inline-block h-5 w-5 rounded-full mr-2"
											title={notation.label?.name}
											style={{
												backgroundColor: convertRGBtoRGBA(notation.label?.color, 1),
											}}
										></div>
									))}
								<div className="flex-grow w-full">
									<Input
										useTooltip
										ref={inputRef}
										placeholder={t("networkById.networkMembersTable.tableRow.updateName")}
										name="memberName"
										onChange={(e) => setValue(e.target.value)}
										onBlur={onBlur}
										value={(value as string) || ""}
										type="text"
										className="input-primary input-sm m-0 border-0 bg-transparent p-0 min-w-full"
									/>
								</div>
							</div>
							<button type="submit" onClick={submitName} className="hidden" />
						</form>
					</div>
				);
			}
			if (id === "ipAssignments") {
				const { noAutoAssignIps, activeBridge } = original || null;
				const hasRfc4193 = networkById?.network?.v6AssignMode?.rfc4193;
				const has6plane = networkById?.network?.v6AssignMode?.["6plane"];

				if (!original.ipAssignments?.length && !hasRfc4193 && !has6plane) {
					return (
						<p className="text-gray-500">
							{t("commonTable.header.ipAssignments.notAssigned")}
						</p>
					);
				}

				const rfc4193Ip = hasRfc4193 ? toRfc4193Ip(nwid, original?.id) : undefined;
				const sixPlaneIp = has6plane ? sixPlane(nwid, original?.id) : undefined;

				const generateClipboardElement = (hasIp: boolean, ip: string) => {
					return hasIp ? (
						<CopyToClipboard
							text={ip}
							onCopy={() =>
								toast.success(t("commonToast.copyToClipboard.success", { element: ip }))
							}
							title={t("commonToast.copyToClipboard.title")}
						>
							<div className="cursor-pointer">
								<div className="badge badge-ghost rounded-md">{ip}</div>
							</div>
						</CopyToClipboard>
					) : null;
				};
				return (
					<div className="space-y-1">
						<div className="text-left">
							{generateClipboardElement(hasRfc4193, rfc4193Ip)}
							{generateClipboardElement(has6plane, sixPlaneIp)}
						</div>

						{original?.ipAssignments?.map((assignedIp) => {
							const subnetMatch = isIPInSubnet(
								assignedIp,
								networkById.network?.routes as RoutesEntity[],
							);
							return (
								<div key={assignedIp} className="flex">
									<div
										className={`${
											subnetMatch
												? "badge badge-primary badge-lg rounded-md"
												: "badge badge-ghost badge-lg rounded-md opacity-60"
										} flex min-w-fit justify-between gap-1`}
									>
										<CopyToClipboard
											text={assignedIp}
											onCopy={() =>
												toast.success(
													t("commonToast.copyToClipboard.success", {
														element: assignedIp,
													}),
												)
											}
											title={t("commonToast.copyToClipboard.title")}
										>
											<div className="cursor-pointer">{assignedIp}</div>
										</CopyToClipboard>
										<div className="text-xs">
											{original?.peers?.latency > 0 && ` (${original?.peers.latency}ms)`}
										</div>
										{original?.ipAssignments.length > 0 && (
											<div title="delete ip assignment">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													strokeWidth="1.5"
													stroke="currentColor"
													className="z-10 ml-4 h-4 w-4 cursor-pointer text-warning"
													onClick={() =>
														deleteIpAssignment(
															original?.ipAssignments,
															assignedIp,
															original?.id,
														)
													}
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
													/>
												</svg>
											</div>
										)}
									</div>
									<div className="flex gap-1 pl-1">
										{noAutoAssignIps ? (
											<kbd title="Do Not Auto-Assign IPs" className="kbd kbd-xs">
												AA
											</kbd>
										) : (
											""
										)}
										{activeBridge ? (
											<kbd title="Allow Ethernet Bridging" className="kbd kbd-xs">
												EB
											</kbd>
										) : (
											""
										)}
									</div>
								</div>
							);
						})}
					</div>
				);
			}
			return getValue();
		},
	};

	return defaultColumn;
};

export default MemberEditCell;
