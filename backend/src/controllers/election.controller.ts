import { Request, Response } from 'express';
import { getActiveElection, getElectionStats, getResults } from '../services/election.service';

export async function getActiveElectionHandler(req: Request, res: Response): Promise<void> {
  try {
    const election = await getActiveElection();

    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Tidak ada pemilihan yang tersedia',
      });
      return;
    }

    const stats = await getElectionStats(election.id);

    res.json({
      success: true,
      data: {
        id: election.id,
        title: election.title,
        description: election.description,
        startDate: election.start_date,
        endDate: election.end_date,
        status: election.status,
        stats,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pemilihan',
    });
  }
}

export async function getResultsHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const electionId = Array.isArray(id) ? String(id[0]) : String(id);
    const results = await getResults(electionId);

    if (!results) {
      res.status(404).json({
        success: false,
        message: 'Hasil belum tersedia atau pemilihan tidak ditemukan',
      });
      return;
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil hasil pemilihan',
    });
  }
}
