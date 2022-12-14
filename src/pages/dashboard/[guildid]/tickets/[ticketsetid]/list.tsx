import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import api from 'datas/api';
import { ChannelMinimal, MemberMinimal } from 'types/DiscordTypes';
import {
  Row,
  Container,
  Spinner,
  Form,
  Table,
  Tab,
  Tabs,
  Card,
  Button,
  ButtonGroup,
  OverlayTrigger,
  Tooltip,
  Modal,
  Col,
} from 'react-bootstrap';
import {
  ErrorOutline as ErrorOutlineIcon,
  Check as CheckIcon,
  LockOutlined as LockIcon,
  SettingsBackupRestoreOutlined as RestoreOutlinedIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import BackTo from 'components/BackTo';
import { Ticket, TicketSet, TranscriptMinimal } from 'types/dbtypes';
import { GetServerSideProps, NextPage } from 'next';
import Router from 'next/router';
import Layout from 'components/Layout';
import DashboardLayout from 'components/DashboardLayout';
import Cookies from 'universal-cookie';
import dayjs from 'dayjs';
import dayjsRelativeTime from 'dayjs/plugin/relativeTime';
import dayjsUTC from 'dayjs/plugin/utc';
import 'dayjs/locale/ko';
import useSWR from 'swr';
import urljoin from 'url-join';
import Head from 'next/head';
import MemberCell from 'components/MemberCell';
dayjs.locale('ko');
dayjs.extend(dayjsRelativeTime);
dayjs.extend(dayjsUTC);

interface TicketListProps {
  guildId: string;
  ticketsetId: string;
}

interface TicketListCardProps {
  onCheckChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  checked?: boolean;
  ticket: Ticket;
  deletedMode?: boolean;
}

export const getServerSideProps: GetServerSideProps<TicketListProps> = async (
  context
) => {
  const { guildid, ticketsetid } = context.query;
  return {
    props: {
      guildId: guildid as string,
      ticketsetId: ticketsetid as string,
    },
  };
};

type TabsType = 'open' | 'closed' | 'deleted';

const TicketList: NextPage<TicketListProps> = ({ guildId, ticketsetId }) => {
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(
    new Set()
  );
  const [showSelectedClose, setShowSelectedClose] = useState<
    'reopen' | 'close' | 'delete' | false
  >(false);
  const [activeTab, setActiveTab] = useState<TabsType>('open');

  const [isMD, setIsMD] = useState<boolean | null>(null);

  const { data, mutate } = useSWR<Ticket[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/servers/${guildId}/tickets/${ticketsetId}`)
      : null,
    (url) =>
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        })
        .then((r) => r.data),
    {
      refreshInterval: 5000,
    }
  );

  const { data: ticketsets } = useSWR<TicketSet[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/servers/${guildId}/ticketsets`)
      : null,
    (url) =>
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        })
        .then((r) => r.data),
    {
      refreshInterval: 5000,
    }
  );

  const { data: members } = useSWR<MemberMinimal[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/discord/guilds/${guildId}/members`)
      : null,
    (url) =>
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        })
        .then((r) => r.data),
    {
      refreshInterval: 5000,
    }
  );

  const { data: channels } = useSWR<ChannelMinimal[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/discord/guilds/${guildId}/channels`)
      : null,
    (url) =>
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        })
        .then((r) => r.data)
  );

  const { data: transcripts } = useSWR<TranscriptMinimal[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/servers/${guildId}/tickets/${ticketsetId}/transcripts`)
      : null,
    (url) =>
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        })
        .then((r) => r.data)
  );

  useEffect(() => {
    if (!new Cookies().get('ACCESS_TOKEN')) {
      const lct = window.location;
      localStorage.setItem('loginFrom', lct.pathname + lct.search);
      window.location.assign('/login');
    } else {
      const tab = location.hash.slice(1);
      if (['open', 'closed'].includes(tab)) {
        setActiveTab(tab as TabsType);
      }

      const resize = () => setIsMD(window.innerWidth >= 768);
      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
  }, []);

  const ticketsSet = new Set(
    data
      ?.map((o) => o.uuid)
      .filter((o) => data?.find((a) => a.uuid === o)?.status === activeTab)
  );
  const finalSelectedSet = new Set(
    Array.from(selectedTickets).filter(
      (o) =>
        data?.find((a) => a.uuid === o)?.status === activeTab &&
        ticketsSet.has(o)
    )
  );

  const TicketListCard: React.FC<TicketListCardProps> = ({
    ticket,
    onCheckChange,
    checked,
    deletedMode = false,
  }) => {
    const [showModal, setShowModal] = useState<
      'close' | 'reopen' | 'delete' | null
    >(null);

    const channel = channels?.find((o) => o.id === ticket.channel);

    const Actions: React.FC = () => (
      <>
        <ButtonGroup>
          {ticket.status === 'open' && (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="ticket-list-close-ticket">?????? ??????</Tooltip>
              }
            >
              <Button
                variant="dark"
                className="d-flex px-1 remove-before"
                onClick={() => setShowModal('close')}
              >
                <LockIcon />
              </Button>
            </OverlayTrigger>
          )}
          {ticket.status === 'closed' && (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="ticket-list-reopen-ticket">?????? ?????? ??????</Tooltip>
              }
            >
              <Button
                variant="dark"
                className="d-flex px-1 remove-before"
                onClick={() => setShowModal('reopen')}
              >
                <RestoreOutlinedIcon />
              </Button>
            </OverlayTrigger>
          )}
          {ticket.status !== 'deleted' && (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="ticket-list-delete-ticket">?????? ????????????</Tooltip>
              }
            >
              <Button
                variant="dark"
                className="d-flex px-1 remove-before"
                onClick={() => setShowModal('delete')}
              >
                <DeleteIcon />
              </Button>
            </OverlayTrigger>
          )}
          {(ticket.status !== 'deleted' ||
            transcripts?.find((o) => o.ticketid === ticket.uuid)) && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id="ticket-list-transcript">?????? ??????</Tooltip>}
            >
              <Button
                variant="dark"
                className="d-flex px-1 remove-before"
                onClick={() =>
                  Router.push(
                    `/dashboard/${guildId}/tickets/${ticketsetId}/${ticket.uuid}/transcripts`,
                    undefined,
                    { shallow: true }
                  )
                }
              >
                <DescriptionIcon />
              </Button>
            </OverlayTrigger>
          )}
        </ButtonGroup>

        <Modal
          className="modal-dark"
          show={!!showModal}
          onHide={() => setShowModal(null)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title
              style={{
                fontFamily: 'NanumSquare',
                fontWeight: 900,
              }}
            >
              {showModal === 'close'
                ? '?????? ??????'
                : showModal === 'reopen'
                ? '?????? ?????? ??????'
                : '?????? ????????????'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-4">
            ??? ?????????{' '}
            {showModal === 'close'
              ? '????????????'
              : showModal === 'reopen'
              ? '?????? ???'
              : '?????????'}
            ????????????????
            <Card bg="dark" className="mt-3">
              <Card.Body>
                <Row className="pb-1">
                  <Col xs={3} className="font-weight-bold">
                    ?????? ??????
                  </Col>
                  <Col className="font-weight-bold">{ticket.number}</Col>
                </Row>
                <Row>
                  <Col xs={3} className="font-weight-bold">
                    ?????? ??????
                  </Col>
                  <Col className="font-weight-bold">
                    {channel ? `#${channel.name}` : <i>(???????????? ?????? ??????)</i>}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer className="justify-content-end">
            <Button
              variant={
                showModal === 'close'
                  ? 'info'
                  : showModal === 'reopen'
                  ? 'secondary'
                  : 'danger'
              }
              onClick={async () => {
                setShowModal(null);

                if (showModal !== 'delete') {
                  axios
                    .post(
                      `${api}/servers/${guildId}/tickets/${showModal}`,
                      {
                        tickets: [ticket.uuid],
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${new Cookies().get(
                            'ACCESS_TOKEN'
                          )}`,
                        },
                      }
                    )
                    .then(() => {
                      mutate().then(() => {
                        let se = new Set(selectedTickets);
                        se.delete(ticket.uuid);
                        setSelectedTickets(se);
                      });
                    });
                } else {
                  axios
                    .delete(`${api}/servers/${guildId}/tickets`, {
                      data: {
                        tickets: [ticket.uuid],
                      },
                      headers: {
                        Authorization: `Bearer ${new Cookies().get(
                          'ACCESS_TOKEN'
                        )}`,
                      },
                    })
                    .then(() => {
                      mutate().then(() => {
                        let se = new Set(selectedTickets);
                        se.delete(ticket.uuid);
                        setSelectedTickets(se);
                      });
                    });
                }
              }}
            >
              ??????
            </Button>
            <Button variant="dark" onClick={() => setShowModal(null)}>
              ??????
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );

    return (
      <tr>
        {!deletedMode && (
          <td className="align-middle text-center">
            <Form.Check
              id={`ticket-check-${ticket.uuid}`}
              type="checkbox"
              checked={checked}
              onChange={onCheckChange}
            />
          </td>
        )}
        {isMD ? (
          <>
            <td className="align-middle">
              <b>#{ticket.number}</b>
            </td>
            <td className="align-middle">
              <MemberCell
                member={members?.find((o) => o.user.id === ticket.opener)!}
                guildId={guildId}
              />
            </td>
            {!deletedMode && (
              <td className="align-middle font-weight-bold">
                {channel ? `#${channel.name}` : <i>(???????????? ?????? ??????)</i>}
              </td>
            )}
            <td className="align-middle">
              {new Date(ticket.created_at).toLocaleString()}
            </td>
            <td className="align-middle text-end">
              <Actions />
            </td>
          </>
        ) : (
          <>
            <td>
              <div className="font-weight-bold pb-2" style={{ fontSize: 18 }}>
                #{ticket.number}
              </div>
              <div>
                <div>
                  {!deletedMode && (
                    <>
                      <b>??????:</b>{' '}
                      <span className="ms-2">
                        {channel ? (
                          `#${channel.name}`
                        ) : (
                          <i>(???????????? ?????? ??????)</i>
                        )}
                      </span>
                    </>
                  )}
                </div>
                <div className="d-flex">
                  <b>?????????:</b>{' '}
                  <span className="ms-3">
                    <MemberCell
                      member={
                        members?.find((o) => o.user.id === ticket.opener)!
                      }
                      guildId={guildId}
                    />
                  </span>
                </div>
                <div className="d-flex">
                  <b>?????? ??????:</b>{' '}
                  <span className="ms-3">
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="d-flex mt-2 align-items-center">
                  {transcripts?.find((o) => o.ticketid === ticket.uuid) && (
                    <Actions />
                  )}
                </div>
              </div>
            </td>
          </>
        )}
      </tr>
    );
  };

  const ListTable: React.FC<{ mode: TabsType }> = ({ mode }) => {
    return (
      <Table
        id={`ticket-${mode}-list-table`}
        variant="dark"
        style={{
          tableLayout: 'fixed',
        }}
      >
        <thead>
          <tr>
            {mode !== 'deleted' && (
              <th className="align-middle text-center" style={{ width: 50 }}>
                <Form.Check
                  id="tickets-select-all"
                  type="checkbox"
                  checked={
                    !!data?.length &&
                    !!ticketsSet.size &&
                    ticketsSet.size === finalSelectedSet.size &&
                    Array.from(ticketsSet).every((value) =>
                      finalSelectedSet.has(value)
                    )
                  }
                  onChange={() => {
                    if (
                      !!ticketsSet.size &&
                      ticketsSet.size === finalSelectedSet.size &&
                      Array.from(ticketsSet).every((value) =>
                        finalSelectedSet.has(value)
                      )
                    ) {
                      setSelectedTickets(new Set());
                    } else {
                      setSelectedTickets(ticketsSet);
                    }
                  }}
                />
              </th>
            )}
            <th className="d-none d-md-table-cell" style={{ width: 200 }}>
              ????????????
            </th>
            <th className="d-none d-md-table-cell">?????????</th>
            {mode !== 'deleted' && (
              <th className="d-none d-md-table-cell" style={{ maxWidth: 400 }}>
                ??????
              </th>
            )}
            <th className="d-none d-md-table-cell">?????? ??????</th>
            <th className="d-none d-md-table-cell" style={{ width: 140 }} />
            <th className="d-md-none" />
          </tr>
        </thead>
        <tbody>
          {data
            ?.filter((o) => o.status === mode)
            .sort((a, b) => b.number - a.number)
            .map((one) => (
              <TicketListCard
                key={one.uuid}
                ticket={one}
                checked={finalSelectedSet.has(one.uuid)}
                deletedMode={mode === 'deleted'}
                onCheckChange={() => {
                  let sel = new Set(finalSelectedSet);

                  if (sel.has(one.uuid)) {
                    sel.delete(one.uuid);
                  } else {
                    sel.add(one.uuid);
                  }

                  setSelectedTickets(sel);
                }}
              />
            ))}
        </tbody>
      </Table>
    );
  };

  const SelectedTicketsAction = (type: 'close' | 'reopen' | 'delete') => {
    (type === 'delete'
      ? axios.delete(`${api}/servers/${guildId}/tickets`, {
          data: {
            tickets: Array.from(finalSelectedSet),
          },
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        })
      : axios.post(
          `${api}/servers/${guildId}/tickets/${type}`,
          {
            tickets: Array.from(finalSelectedSet),
          },
          {
            headers: {
              Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
            },
          }
        )
    ).then(() => {
      console.log('ds');
      mutate().then(() => setSelectedTickets(new Set()));
    });
  };

  return (
    <>
      <Head>
        <title>?????? ?????? ?????? - Aztra ????????????</title>
      </Head>
      <Layout>
        <DashboardLayout guildId={guildId}>
          {() =>
            data && ticketsets && members && channels ? (
              <>
                <Row className="dashboard-section">
                  <div>
                    <BackTo
                      className="ps-2 mb-4"
                      name="?????? ??????"
                      to={`/dashboard/${guildId}/tickets`}
                    />
                    <h3>?????? ?????? ??????</h3>
                  </div>
                </Row>

                <Row className="flex-column px-3">
                  <Card bg="dark" className="px-1">
                    <Card.Body className="py-2 d-flex align-items-center">
                      ??????:
                      <h5
                        className="mb-0 ps-2"
                        style={{ fontFamily: 'NanumSquare' }}
                      >
                        {ticketsets?.find((o) => o.uuid === ticketsetId)?.name}
                      </h5>
                    </Card.Body>
                  </Card>
                </Row>

                <Row className="mt-3 px-1">
                  <div className="d-flex justify-content-end align-items-center">
                    {activeTab === 'open' && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="d-flex align-items-center my-1"
                        disabled={!finalSelectedSet.size}
                        onClick={() => setShowSelectedClose('close')}
                      >
                        <LockIcon className="me-1" />
                        ?????? ?????? ??????
                      </Button>
                    )}
                    {activeTab === 'closed' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="d-flex align-items-center my-1"
                        disabled={!finalSelectedSet.size}
                        onClick={() => setShowSelectedClose('reopen')}
                      >
                        <LockIcon className="me-1" />
                        ?????? ?????? ?????? ??????
                      </Button>
                    )}
                    {activeTab !== 'deleted' && (
                      <Button
                        variant="dark"
                        size="sm"
                        className="ms-3 d-flex align-items-center my-1"
                        disabled={!finalSelectedSet.size}
                        onClick={() => setShowSelectedClose('delete')}
                      >
                        <DeleteIcon className="me-1" />
                        ?????? ?????? ??????
                      </Button>
                    )}
                  </div>
                </Row>

                <Row className="flex-column mt-2 nav-tabs-dark px-3 tab-content-no-padding">
                  <Tabs
                    activeKey={activeTab}
                    id="ticket-list-tabs"
                    transition={false}
                    onSelect={(e) => {
                      location.hash = e ?? 'open';
                      setActiveTab((e as TabsType) ?? 'open');
                    }}
                  >
                    <Tab
                      eventKey="open"
                      title={
                        <>
                          <ErrorOutlineIcon className="me-2" />
                          ?????? ??????
                        </>
                      }
                    >
                      <ListTable mode="open" />
                    </Tab>
                    <Tab
                      eventKey="closed"
                      title={
                        <>
                          <CheckIcon className="me-2" />
                          ?????? ??????
                        </>
                      }
                    >
                      <ListTable mode="closed" />
                    </Tab>
                    <Tab
                      eventKey="deleted"
                      title={
                        <>
                          <CloseIcon className="me-2" />
                          ????????? ??????
                        </>
                      }
                    >
                      <ListTable mode="deleted" />
                    </Tab>
                  </Tabs>
                </Row>

                <Row>
                  <Modal
                    className="modal-dark"
                    show={showSelectedClose}
                    onHide={() => setShowSelectedClose(false)}
                    centered
                  >
                    <Modal.Header closeButton>
                      <Modal.Title
                        style={{
                          fontFamily: 'NanumSquare',
                          fontWeight: 900,
                        }}
                      >
                        {showSelectedClose === 'close'
                          ? '?????? ??????'
                          : showSelectedClose === 'reopen'
                          ? '?????? ?????? ??????'
                          : '?????? ????????????'}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="py-4">
                      <p className="font-weight-bold" style={{ fontSize: 17 }}>
                        ????????? ?????? {finalSelectedSet.size}??????{' '}
                        {showSelectedClose === 'close'
                          ? '?????????'
                          : showSelectedClose === 'reopen'
                          ? '?????? ??????'
                          : '????????????'}
                        ?????????????
                      </p>
                      <small>
                        {showSelectedClose === 'delete' ? (
                          <b>- ????????? ???????????? ????????? ??? ????????????!</b>
                        ) : (
                          <>
                            - ?????????{' '}
                            {showSelectedClose === 'close'
                              ? '?????????'
                              : '?????? ??????'}{' '}
                            <b>
                              {showSelectedClose === 'close'
                                ? '?????? ??????'
                                : '?????? ??????'}
                            </b>
                            ?????? ????????????,{' '}
                            {showSelectedClose === 'close'
                              ? '?????? ??????'
                              : '?????? ??????'}{' '}
                            ???????????? ????????????, ?????? ????????? ?????? ?????? ???????????????.
                          </>
                        )}
                      </small>
                    </Modal.Body>
                    <Modal.Footer className="justify-content-end">
                      <Button
                        variant={activeTab === 'open' ? 'danger' : 'secondary'}
                        onClick={async () => {
                          setShowSelectedClose(false);
                          showSelectedClose !== false &&
                            SelectedTicketsAction(showSelectedClose);
                        }}
                      >
                        ??????
                      </Button>
                      <Button
                        variant="dark"
                        onClick={() => setShowSelectedClose(false)}
                      >
                        ??????
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </Row>
              </>
            ) : (
              <Container
                className="d-flex align-items-center justify-content-center flex-column"
                style={{
                  height: '500px',
                }}
              >
                <h3 className="pb-4">???????????? ???</h3>
                <Spinner animation="border" variant="aztra" />
              </Container>
            )
          }
        </DashboardLayout>
      </Layout>
    </>
  );
};

export default TicketList;
